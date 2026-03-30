# Lease Document Parser API

Backend Python API for parsing lease documents (PDF, DOCX) and extracting information using OpenAI.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Run

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### POST /parse
Parse a lease document file.

**Request:** multipart/form-data with file field
**Response:** JSON with extracted lease information

### GET /health
Health check endpoint.

## Supported File Types

- PDF (.pdf)
- Word documents (.docx, .doc)

## Example Usage

```bash
curl -X POST "http://localhost:8000/parse" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@lease_document.pdf"
```
