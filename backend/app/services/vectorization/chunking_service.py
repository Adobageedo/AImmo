"""
Document chunking service for AImmo.
Loads and splits documents into chunks for vectorization.
"""

import os
import hashlib
from typing import List, Dict, Any, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredPDFLoader,
    Docx2txtLoader,
    UnstructuredWordDocumentLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
    UnstructuredPowerPointLoader,
    CSVLoader,
    UnstructuredExcelLoader
)
import pandas as pd
import uuid
import logging

logger = logging.getLogger(__name__)


SUPPORTED_EXTENSIONS = {
    '.pdf', '.docx', '.doc', '.txt', '.md', '.markdown',
    '.pptx', '.ppt', '.csv', '.xlsx', '.xls', '.xlsm'
}


class ChunkingService:
    """Service for loading and chunking documents."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize chunking service.
        
        Args:
            chunk_size: Maximum size of each chunk
            chunk_overlap: Overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            add_start_index=True
        )
    
    def compute_file_hash(self, file_path: str) -> str:
        """
        Compute SHA-256 hash of file content.
        
        Args:
            file_path: Path to file
            
        Returns:
            Hexadecimal hash string
        """
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                hasher.update(chunk)
        return hasher.hexdigest()
    
    def is_supported(self, file_path: str) -> bool:
        """
        Check if file type is supported.
        
        Args:
            file_path: Path to file
            
        Returns:
            True if supported
        """
        ext = os.path.splitext(file_path)[1].lower()
        return ext in SUPPORTED_EXTENSIONS
    
    def load_document(self, file_path: str, metadata: Dict[str, Any]) -> List[Document]:
        """
        Load a document using appropriate loader.
        
        Args:
            file_path: Path to document file
            metadata: Base metadata to attach to all chunks
            
        Returns:
            List of Langchain Document objects
        """
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}")
        
        docs = []
        
        try:
            # PDF documents
            if ext == '.pdf':
                try:
                    loader = PyPDFLoader(file_path)
                    docs = loader.load()
                    
                    # Check if extraction was successful
                    if not docs or all(len(doc.page_content.strip()) < 10 for doc in docs):
                        logger.warning("PyPDFLoader extraction insufficient, trying UnstructuredPDFLoader")
                        loader = UnstructuredPDFLoader(file_path)
                        docs = loader.load()
                except Exception as e:
                    logger.warning(f"PDF loading failed: {e}, trying fallback")
                    loader = UnstructuredPDFLoader(file_path)
                    docs = loader.load()
            
            # Word documents
            elif ext in {'.docx', '.doc'}:
                try:
                    loader = Docx2txtLoader(file_path)
                    docs = loader.load()
                except Exception as e:
                    logger.warning(f"Docx2txt failed: {e}, trying Unstructured")
                    loader = UnstructuredWordDocumentLoader(file_path)
                    docs = loader.load()
            
            # Text files
            elif ext == '.txt':
                loader = TextLoader(file_path, encoding='utf-8', autodetect_encoding=True)
                docs = loader.load()
            
            # Markdown files
            elif ext in {'.md', '.markdown'}:
                try:
                    loader = UnstructuredMarkdownLoader(file_path)
                    docs = loader.load()
                except Exception as e:
                    logger.warning(f"Markdown loader failed: {e}, using TextLoader")
                    loader = TextLoader(file_path, encoding='utf-8')
                    docs = loader.load()
            
            # PowerPoint files
            elif ext in {'.pptx', '.ppt'}:
                loader = UnstructuredPowerPointLoader(file_path)
                docs = loader.load()
            
            # Excel/CSV files
            elif ext == '.csv':
                try:
                    df = pd.read_csv(file_path, encoding='utf-8')
                    text = df.to_csv(index=False)
                    docs = [Document(page_content=text)]
                except Exception as e:
                    logger.warning(f"CSV reading failed: {e}, trying latin-1")
                    df = pd.read_csv(file_path, encoding='latin-1')
                    text = df.to_csv(index=False)
                    docs = [Document(page_content=text)]
            
            elif ext in {'.xlsx', '.xls', '.xlsm'}:
                try:
                    loader = UnstructuredExcelLoader(file_path, mode="elements")
                    docs = loader.load()
                except Exception as e:
                    logger.warning(f"Excel loader failed: {e}, trying pandas")
                    xlsx = pd.ExcelFile(file_path)
                    all_texts = []
                    for sheet in xlsx.sheet_names:
                        try:
                            df = pd.read_excel(file_path, sheet_name=sheet)
                            sheet_text = f"### Sheet: {sheet} ###\n{df.to_csv(index=False)}"
                            all_texts.append(sheet_text)
                        except Exception as sheet_error:
                            logger.warning(f"Failed to read sheet '{sheet}': {sheet_error}")
                    
                    if all_texts:
                        text = "\n\n".join(all_texts)
                        docs = [Document(page_content=text)]
                    else:
                        raise ValueError("No sheets could be read")
            
            else:
                raise ValueError(f"Unsupported extension: {ext}")
            
        except Exception as e:
            logger.error(f"Failed to load document {file_path}: {e}")
            raise
        
        # Attach metadata to all loaded documents
        for doc in docs:
            doc.metadata.update(metadata)
        
        return docs
    
    def chunk_document(
        self,
        file_path: str,
        metadata: Dict[str, Any]
    ) -> List[Document]:
        """
        Load and chunk a document.
        
        Args:
            file_path: Path to document
            metadata: Base metadata (document_id, organization_id, etc.)
            
        Returns:
            List of chunked Document objects with metadata
        """
        logger.info(f"Chunking document: {file_path}")
        
        # Load document
        docs = self.load_document(file_path, metadata)
        
        if not docs:
            logger.warning(f"No content extracted from {file_path}")
            return []
        
        # Split into chunks
        chunks = self.splitter.split_documents(docs)
        
        logger.info(f"Split {len(docs)} pages into {len(chunks)} chunks")
        
        # Add chunk-specific metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                "chunk_id": i,
                "num_chunks": len(chunks),
                "unique_id": str(uuid.uuid4()),
                "page_content": chunk.page_content
            })
        
        return chunks
    
    def chunk_documents_batch(
        self,
        file_infos: List[Dict[str, Any]]
    ) -> Dict[str, List[Document]]:
        """
        Chunk multiple documents in batch.
        
        Args:
            file_infos: List of dicts with keys: file_path, metadata
            
        Returns:
            Dict mapping file_path to list of chunks
        """
        results = {}
        
        for file_info in file_infos:
            file_path = file_info["file_path"]
            metadata = file_info["metadata"]
            
            try:
                chunks = self.chunk_document(file_path, metadata)
                results[file_path] = chunks
                logger.info(f"✓ {len(chunks)} chunks generated for {file_path}")
            except Exception as e:
                logger.error(f"✗ Failed to chunk {file_path}: {e}")
                results[file_path] = []
        
        return results


# Singleton instance
chunking_service = ChunkingService()
