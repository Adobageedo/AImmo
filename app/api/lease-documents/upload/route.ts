import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import Fuse from 'fuse.js';
import { fileStorageService } from '@/lib/services/file-storage.service';

// Import pdf2json for server-side PDF parsing
import PDFParser from 'pdf2json';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Types
interface ExtractedLeaseData {
  landlord_name?: string;
  landlord_address?: string;
  landlord_email?: string;
  landlord_phone?: string;
  tenant_name?: string;
  tenant_company_name?: string;
  tenant_address?: string;
  tenant_email?: string;
  tenant_phone?: string;
  property_address?: string;
  property_city?: string;
  property_postal_code?: string;
  property_type?: string;
  property_surface?: number;
  lease_type?: string;
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  monthly_rent?: number;
  charges?: number;
  deposit?: number;
  payment_day?: number;
  indexation_clause?: boolean;
  special_clauses?: string[];
  confidence_score?: number;
  extraction_method?: string;
  raw_text?: string;
}

interface EntityMatch {
  type: 'property' | 'owner' | 'tenant';
  status: 'exact' | 'fuzzy' | 'new';
  confidence: number;
  existing_id?: string;
  existing_name?: string;
  extracted_data: any;
  suggested_action: 'link' | 'create' | 'review';
}

// Helper functions
function getFileType(filename: string): 'pdf' | 'word' | 'image' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext || '')) return 'word';
  if (['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext || '')) return 'image';
  throw new Error(`Unsupported file type: ${ext}`);
}

async function parseWithAI(file: File): Promise<ExtractedLeaseData> {
  console.log('🤖 Starting AI parsing with Python API...');
  
  // First try Python API
  try {
    console.log('📡 Calling Python API at http://localhost:8000/parse');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('http://localhost:8000/parse', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Successfully parsed with Python API');
        
        // Create entity matches for the processing step
        const entityMatches = {
          property: {
            type: 'property' as const,
            status: 'new' as const,
            confidence: result.data.confidence_score || 0.0,
            extracted_data: {
              address: result.data.property_address,
              city: result.data.property_city,
              postal_code: result.data.property_postal_code,
              type: result.data.property_type,
              surface: result.data.property_surface
            },
            suggested_action: 'create' as const
          },
          owner: {
            type: 'owner' as const,
            status: 'new' as const,
            confidence: result.data.confidence_score || 0.0,
            extracted_data: {
              name: result.data.landlord_name,
              address: result.data.landlord_address,
              email: result.data.landlord_email,
              phone: result.data.landlord_phone,
              city: undefined,
              postal_code: undefined
            },
            suggested_action: 'create' as const
          },
          tenant: {
            type: 'tenant' as const,
            status: 'new' as const,
            confidence: result.data.confidence_score || 0.0,
            extracted_data: {
              name: result.data.tenant_name,
              address: result.data.tenant_address,
              email: result.data.tenant_email,
              phone: result.data.tenant_phone,
              city: undefined,
              postal_code: undefined
            },
            suggested_action: 'create' as const
          }
        };

        // Store entity matches for processing step
        (global as any).mockEntityMatches = entityMatches;
        
        // Also include entity matches in extracted data as custom property
        (result.data as any)._entity_matches = entityMatches;

        return result.data as ExtractedLeaseData;
      }
    }
    
    console.log('⚠️ Python API failed, falling back to local parsing');
  } catch (error) {
    console.log('⚠️ Python API unavailable, falling back to local parsing:', error instanceof Error ? error.message : error);
  }
  
  // Fallback to local parsing
  console.log('🤖 Starting fallback AI parsing with local OpenAI...');
  
  // Extract text from file first
  let text = '';
  let method = 'unknown';
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'word';
    
    // Extract text based on file type
    if (fileType === 'pdf') {
      console.log('📄 Extracting text from PDF using pdf2json...');
      
      try {
        const pdfParser = new PDFParser();
        
        // Create temporary file path
        const tempPath = `/tmp/${Date.now()}.pdf`;
        require('fs').writeFileSync(tempPath, buffer);
        
        try {
          const result = await new Promise((resolve, reject) => {
            pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
              // Extract text from all pages
              let fullText = '';
              if (pdfData.Pages) {
                pdfData.Pages.forEach((page: any) => {
                  if (page.Texts) {
                    page.Texts.forEach((text: any) => {
                      if (text.R && text.R.length > 0) {
                        text.R.forEach((r: any) => {
                          if (r.T) {
                            try {
                              fullText += decodeURIComponent(r.T) + ' ';
                            } catch (e) {
                              // If decodeURIComponent fails, use the raw text
                              fullText += r.T + ' ';
                            }
                          }
                        });
                      }
                    });
                  }
                });
              }
              resolve(fullText.trim());
            });
            
            pdfParser.loadPDF(tempPath);
          });
          
          text = result as string;
          method = 'pdf2json';
          console.log('✅ PDF parsed with pdf2json');
        } finally {
          // Clean up temp file
          require('fs').unlinkSync(tempPath);
        }
      } catch (error) {
        console.log('❌ PDF parsing failed:', error);
        text = '';
        method = 'pdf2json';
      }
      
      console.log(`📝 Final extracted text: ${text.length} characters (method: ${method})`);
    } else if (fileType === 'word') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      method = 'word';
    }
    
    console.log(`📝 Text extracted: ${text.length} characters (method: ${method})`);
  } catch (error) {
    console.error('❌ Text extraction failed:', error);
    text = '';
  }
  
  // If no text extracted, return mock data for UI testing
  if (!text || text.trim().length === 0) {
    console.log('⚠️ No text available - returning mock data for UI testing');
    
    const mockData: ExtractedLeaseData = {
      landlord_name: "Document scanné",
      landlord_address: "Extraction automatique impossible",
      landlord_email: undefined,
      landlord_phone: undefined,
      tenant_name: "Document scanné",
      tenant_company_name: undefined,
      tenant_address: "Extraction automatique impossible",
      tenant_email: undefined,
      tenant_phone: undefined,
      property_address: "Document scanné",
      property_city: undefined,
      property_postal_code: undefined,
      property_type: "inconnu",
      property_surface: undefined,
      lease_type: "inconnu",
      start_date: undefined,
      end_date: undefined,
      duration_months: undefined,
      monthly_rent: undefined,
      charges: undefined,
      deposit: undefined,
      payment_day: undefined,
      indexation_clause: undefined,
      special_clauses: undefined,
      confidence_score: 0.0,
      extraction_method: "scanned_document",
      raw_text: ''
    };
    
    return mockData;
  }
  
  const prompt = `
Analyse ce document de bail immobilier français et extrait TOUTES les informations suivantes au format JSON.
Si une information n'est pas trouvée, utilise null.

Format JSON attendu:
{
  "landlord_name": "Nom complet du propriétaire/bailleur",
  "landlord_address": "Adresse complète du propriétaire",
  "landlord_email": "Email du propriétaire",
  "landlord_phone": "Téléphone du propriétaire",
  "tenant_name": "Nom complet du locataire/preneur",
  "tenant_company_name": "Nom de l'entreprise si locataire professionnel",
  "tenant_address": "Adresse actuelle du locataire",
  "tenant_email": "Email du locataire",
  "tenant_phone": "Téléphone du locataire",
  "property_address": "Adresse complète du bien loué",
  "property_city": "Ville du bien",
  "property_postal_code": "Code postal du bien",
  "property_type": "Type de bien (appartement, maison, local commercial, etc.)",
  "property_surface": 50.5,
  "lease_type": "residential|commercial|furnished|unfurnished|seasonal",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "duration_months": 12,
  "monthly_rent": 1200.00,
  "charges": 150.00,
  "deposit": 2400.00,
  "payment_day": 5,
  "indexation_clause": true,
  "special_clauses": ["clause 1", "clause 2"]
}

Document à analyser:
---
${text}
---

Réponds UNIQUEMENT avec le JSON, sans texte additionnel.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en analyse de contrats de bail immobilier français. Tu extrais les informations de manière précise et structurée au format JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content) as ExtractedLeaseData;
    
    // Calculate confidence score
    const criticalFields = ['landlord_name', 'tenant_name', 'property_address', 'start_date', 'monthly_rent'];
    const importantFields = ['end_date', 'deposit', 'property_city', 'property_postal_code'];
    const optionalFields = ['charges', 'landlord_email', 'tenant_email', 'property_surface'];

    let score = 0;
    const criticalPresent = criticalFields.filter(field => {
      const value = result[field as keyof ExtractedLeaseData];
      return value !== null && value !== undefined && value !== '';
    }).length;
    score += (criticalPresent / criticalFields.length) * 0.5;

    const importantPresent = importantFields.filter(field => {
      const value = result[field as keyof ExtractedLeaseData];
      return value !== null && value !== undefined && value !== '';
    }).length;
    score += (importantPresent / importantFields.length) * 0.3;

    const optionalPresent = optionalFields.filter(field => {
      const value = result[field as keyof ExtractedLeaseData];
      return value !== null && value !== undefined && value !== '';
    }).length;
    score += (optionalPresent / optionalFields.length) * 0.2;

    result.confidence_score = Math.round(score * 100) / 100;
    result.extraction_method = method;
    result.raw_text = text; // Store the full extracted text

    // Create entity matches for the processing step
    const entityMatches = {
      property: {
        type: 'property' as const,
        status: 'new' as const,
        confidence: result.confidence_score,
        extracted_data: {
          address: result.property_address,
          city: result.property_city,
          postal_code: result.property_postal_code,
          type: result.property_type,
          surface: result.property_surface
        },
        suggested_action: 'create' as const
      },
      owner: {
        type: 'owner' as const,
        status: 'new' as const,
        confidence: result.confidence_score,
        extracted_data: {
          name: result.landlord_name,
          address: result.landlord_address,
          email: result.landlord_email,
          phone: result.landlord_phone,
          city: undefined,
          postal_code: undefined
        },
        suggested_action: 'create' as const
      },
      tenant: {
        type: 'tenant' as const,
        status: 'new' as const,
        confidence: result.confidence_score,
        extracted_data: {
          name: result.tenant_name,
          address: result.tenant_address,
          email: result.tenant_email,
          phone: result.tenant_phone,
          city: undefined,
          postal_code: undefined
        },
        suggested_action: 'create' as const
      }
    };

    // Store entity matches for processing step
    (global as any).mockEntityMatches = entityMatches;
    
    // Also include entity matches in extracted data as custom property
    (result as any)._entity_matches = entityMatches;

    return result;
  } catch (error) {
    console.error('❌ AI parsing error:', error);
    throw new Error(`Failed to parse with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function matchEntities(extractedData: ExtractedLeaseData, organizationId: string) {
  console.log('🔍 Starting entity matching...');
  
  const [property, owner, tenant] = await Promise.all([
    matchProperty(extractedData, organizationId),
    matchOwner(extractedData, organizationId),
    matchTenant(extractedData, organizationId)
  ]);

  console.log('✅ Entity matching completed');
  return { property, owner, tenant };
}

async function matchProperty(extractedData: ExtractedLeaseData, organizationId: string): Promise<EntityMatch | undefined> {
  const address = extractedData.property_address;
  if (!address || address.trim().length === 0) {
    return { type: 'property', status: 'new', confidence: 1.0, extracted_data: { address }, suggested_action: 'create' };
  }

  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('organization_id', organizationId);

    if (error || !properties || properties.length === 0) {
      return { type: 'property', status: 'new', confidence: 1.0, extracted_data: { address }, suggested_action: 'create' };
    }

    const fuse = new Fuse(properties, {
      keys: ['address', 'city', 'postal_code'],
      threshold: 0.3,
      includeScore: true
    });

    const searchString = `${address} ${extractedData.property_city || ''} ${extractedData.property_postal_code || ''}`.trim();
    const results = fuse.search(searchString);

    if (results.length === 0) {
      return { type: 'property', status: 'new', confidence: 1.0, extracted_data: { address }, suggested_action: 'create' };
    }

    const bestMatch = results[0];
    const score = 1 - (bestMatch.score || 0);
    const confidence = Math.round(score * 100) / 100;
    const item = bestMatch.item as any;

    if (confidence >= 0.9) {
      return {
        type: 'property',
        status: 'exact',
        confidence,
        existing_id: item.id,
        existing_name: `${item.address} - ${item.city}`,
        extracted_data: { address },
        suggested_action: 'link'
      };
    } else if (confidence >= 0.7) {
      return {
        type: 'property',
        status: 'fuzzy',
        confidence,
        existing_id: item.id,
        existing_name: `${item.address} - ${item.city}`,
        extracted_data: { address },
        suggested_action: 'review'
      };
    } else {
      return { type: 'property', status: 'new', confidence: 1.0, extracted_data: { address }, suggested_action: 'create' };
    }
  } catch (error) {
    console.error('❌ Property matching error:', error);
    return { type: 'property', status: 'new', confidence: 1.0, extracted_data: { address }, suggested_action: 'create' };
  }
}

async function matchOwner(extractedData: ExtractedLeaseData, organizationId: string): Promise<EntityMatch | undefined> {
  const name = extractedData.landlord_name;
  if (!name || name.trim().length === 0) {
    return { type: 'owner', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
  }

  try {
    const { data: owners, error } = await supabase
      .from('owners')
      .select('*')
      .eq('organization_id', organizationId);

    if (error || !owners || owners.length === 0) {
      return { type: 'owner', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
    }

    const fuse = new Fuse(owners, {
      keys: ['name', 'first_name', 'last_name'],
      threshold: 0.3,
      includeScore: true
    });

    const results = fuse.search(name);

    if (results.length === 0) {
      return { type: 'owner', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
    }

    const bestMatch = results[0];
    const score = 1 - (bestMatch.score || 0);
    const confidence = Math.round(score * 100) / 100;
    const item = bestMatch.item as any;

    const ownerName = item.name || 
      `${item.first_name || ''} ${item.last_name || ''}`.trim();

    if (confidence >= 0.9) {
      return {
        type: 'owner',
        status: 'exact',
        confidence,
        existing_id: item.id,
        existing_name: ownerName,
        extracted_data: { name },
        suggested_action: 'link'
      };
    } else if (confidence >= 0.7) {
      return {
        type: 'owner',
        status: 'fuzzy',
        confidence,
        existing_id: item.id,
        existing_name: ownerName,
        extracted_data: { name },
        suggested_action: 'review'
      };
    } else {
      return { type: 'owner', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
    }
  } catch (error) {
    console.error('❌ Owner matching error:', error);
    return { type: 'owner', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
  }
}

async function matchTenant(extractedData: ExtractedLeaseData, organizationId: string): Promise<EntityMatch | undefined> {
  const name = extractedData.tenant_name || extractedData.tenant_company_name;
  if (!name || name.trim().length === 0) {
    return { type: 'tenant', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
  }

  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('organization_id', organizationId);

    if (error || !tenants || tenants.length === 0) {
      return { type: 'tenant', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
    }

    const fuse = new Fuse(tenants, {
      keys: ['first_name', 'last_name', 'company_name'],
      threshold: 0.3,
      includeScore: true
    });

    const results = fuse.search(name);

    if (results.length === 0) {
      return { type: 'tenant', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
    }

    const bestMatch = results[0];
    const score = 1 - (bestMatch.score || 0);
    const confidence = Math.round(score * 100) / 100;
    const item = bestMatch.item as any;

    const tenantName = item.company_name || 
      `${item.first_name || ''} ${item.last_name || ''}`.trim();

    if (confidence >= 0.9) {
      return {
        type: 'tenant',
        status: 'exact',
        confidence,
        existing_id: item.id,
        existing_name: tenantName,
        extracted_data: { name },
        suggested_action: 'link'
      };
    } else if (confidence >= 0.7) {
      return {
        type: 'tenant',
        status: 'fuzzy',
        confidence,
        existing_id: item.id,
        existing_name: tenantName,
        extracted_data: { name },
        suggested_action: 'review'
      };
    } else {
      return { type: 'tenant', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
    }
  } catch (error) {
    console.error('❌ Tenant matching error:', error);
    return { type: 'tenant', status: 'new', confidence: 1.0, extracted_data: { name }, suggested_action: 'create' };
  }
}

// Main handler
export async function POST(request: NextRequest) {
  console.log('📤 Upload request received');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organization_id') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ success: false, message: 'organization_id is required' }, { status: 400 });
    }

    // Validate file type
    const fileType = getFileType(file.name);
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Unsupported file type' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'File too large (max 10MB)' }, { status: 413 });
    }

    const fileId = uuidv4();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    console.log(`📄 File: ${file.name}, Type: ${fileType}, Size: ${file.size} bytes`);

    // Ensure storage bucket exists
    await fileStorageService.ensureBucketExists();

    // Upload original file to Supabase Storage
    console.log('� Uploading original file to Supabase Storage...');
    const { storagePath } = await fileStorageService.uploadOriginal(
      organizationId,
      fileId,
      file.name,
      fileBuffer,
      file.type
    );
    console.log(`✅ Original file stored at: ${storagePath}`);

    // Create document record
    const document = {
      id: fileId,
      organization_id: organizationId,
      file_name: file.name,
      file_type: fileType,
      file_size: file.size,
      file_url: storagePath,
      storage_path: storagePath,
      extraction_status: 'pending',
      uploaded_at: new Date().toISOString()
    };

    const { error: docError } = await supabase
      .from('lease_documents')
      .insert(document);

    if (docError) {
      console.error('❌ Document insert error:', docError);
      return NextResponse.json({ success: false, message: `Database error: ${docError.message}` }, { status: 500 });
    }

    // Create extraction record
    const extractionId = uuidv4();
    const extraction = {
      id: extractionId,
      document_id: fileId,
      organization_id: organizationId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: extError } = await supabase
      .from('lease_document_extractions')
      .insert(extraction);

    if (extError) {
      console.error('❌ Extraction insert error:', extError);
      return NextResponse.json({ success: false, message: `Database error: ${extError.message}` }, { status: 500 });
    }

    // Process extraction in background
    processExtraction(extractionId, fileBuffer, fileType, organizationId).catch(err => {
      console.error('❌ Background extraction error:', err);
    });

    console.log('✅ Upload successful, extraction started');

    return NextResponse.json({
      success: true,
      document,
      extraction: {
        id: extractionId,
        document_id: fileId,
        organization_id: organizationId,
        status: 'pending',
        created_at: extraction.created_at
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}

async function processExtraction(
  extractionId: string,
  fileBuffer: Buffer,
  fileType: string,
  organizationId: string
) {
  try {
    // Get document_id from extraction record
    const { data: extractionRecord, error: fetchError } = await supabase
      .from('lease_document_extractions')
      .select('document_id')
      .eq('id', extractionId)
      .single();

    if (fetchError || !extractionRecord?.document_id) {
      throw new Error('Failed to retrieve document_id from extraction record');
    }

    const documentId = extractionRecord.document_id;

    // Update status to processing
    await supabase
      .from('lease_document_extractions')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', extractionId);

    console.log(`🔄 Processing extraction ${extractionId} for document ${documentId}...`);

    // Step 1: Parse with AI using the original file to get both JSON and raw text
    console.log('🤖 Starting AI parsing with original file...');
    
    // Create a File object from the buffer
    const file = new File([new Uint8Array(fileBuffer)], `lease_document.${fileType === 'pdf' ? 'pdf' : 'docx'}`, {
      type: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    const extractedData = await parseWithAI(file);
    console.log("✅ [DEBUG] AI parsing result:", extractedData);
    
    // Step 2: Upload the extracted raw text to Supabase Storage
    let rawTextPath: string | null = null;
    if (extractedData.raw_text && extractedData.raw_text.length > 0) {
      try {
        const rawTextResult = await fileStorageService.uploadRawText(
          organizationId,
          documentId,
          extractedData.raw_text
        );
        rawTextPath = rawTextResult.storagePath;
        console.log(`📄 Full raw text uploaded to Storage: ${rawTextPath}`);
      } catch (storageErr) {
        console.error('⚠️ Failed to upload raw text to storage (continuing):', storageErr);
      }
    }
    
    // Store only a preview in the extraction record (full text is in Storage)
    extractedData.raw_text = extractedData.raw_text ? extractedData.raw_text.substring(0, 500) : '';

    // Step 3: Match entities
    let entityMatches;
    
    if (extractedData.extraction_method === 'mock' && (global as any).mockEntityMatches) {
      entityMatches = (global as any).mockEntityMatches;
    } else if ((extractedData as any)._entity_matches) {
      entityMatches = (extractedData as any)._entity_matches;
    } else {
      entityMatches = await matchEntities(extractedData, organizationId);
    }

    // Update extraction record with results
    await supabase
      .from('lease_document_extractions')
      .update({
        status: 'completed',
        extracted_data: extractedData,
        entity_matches: entityMatches,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', extractionId);

    // Update lease_documents with text preview + storage paths
    const docUpdate: Record<string, unknown> = {
      text_content: extractedData.raw_text ? extractedData.raw_text.substring(0, 2000) : '', // Preview only, full text in Storage
      extraction_status: 'completed',
      updated_at: new Date().toISOString(),
    };
    if (rawTextPath) {
      docUpdate.raw_text_path = rawTextPath;
    }

    const { error: textUpdateError } = await supabase
      .from('lease_documents')
      .update(docUpdate)
      .eq('id', documentId);

    if (textUpdateError) {
      console.error('❌ Error updating lease_documents:', textUpdateError);
    }

    console.log(`✅ Extraction ${extractionId} completed successfully`);

  } catch (error) {
    console.error(`❌ Extraction ${extractionId} failed:`, error);

    await supabase
      .from('lease_document_extractions')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', extractionId);
  }
}
