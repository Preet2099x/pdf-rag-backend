import { Worker } from 'bullmq';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// Custom Hugging Face embeddings class
class HuggingFaceEmbeddings {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';
  }

  async embedDocuments(documents) {
    const texts = documents.map((doc) => doc.pageContent || doc);
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: texts }),
    });

    const vectors = await response.json();
    if (!Array.isArray(vectors)) {
      throw new Error(`Hugging Face API error: ${JSON.stringify(vectors)}`);
    }
    return vectors;
  }

  async embedQuery(text) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    const vector = await response.json();
    if (!Array.isArray(vector)) {
      throw new Error(`Hugging Face API error: ${JSON.stringify(vector)}`);
    }
    return vector;
  }
}

const worker = new Worker(
  'file-upload-queue',
  async (job) => {
    console.log(`Received job data:`, job.data);

    const data = JSON.parse(job.data);
    console.log(`Parsed job data:`, data);

    const loader = new PDFLoader(data.path);
    console.log(`Loading PDF from path: ${data.path}...`);
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} documents from PDF.`);

    console.log(`Sample document text (first 200 chars):`, docs[0]?.pageContent?.substring(0, 200));

    try {
      // Load embeddings with API key from .env
      const embeddings = new HuggingFaceEmbeddings(process.env.HUGGINGFACE_API_KEY);
      console.log('Created HuggingFaceEmbeddings instance.');

      // Connect to Qdrant with env values
      const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: 'langchainjs-testing',
      });
      console.log('Connected to Qdrant vector store collection.');

      await vectorStore.addDocuments(docs);
      console.log(`All documents added to the vector store.`);
    } catch (error) {
      console.error('❌ Error during embedding or vector store operation:');
      console.error(error);
    }
  },
  {
    concurrency: 100,
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }
);

console.log('Worker started and listening to file-upload-queue...');
