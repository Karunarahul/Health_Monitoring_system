// API client that works in both development and production
import { MockBackendService } from '../services/mockBackend';

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? 'http://localhost:3001' : '';

class ApiClient {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // In production, use mock backend
    if (!isDevelopment) {
      return this.handleMockRequest(endpoint, options);
    }

    // In development, try real backend first, fallback to mock
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Backend not available, using mock data:', error);
      return this.handleMockRequest(endpoint, options);
    }
  }

  private async handleMockRequest(endpoint: string, options: RequestInit = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;

    switch (endpoint) {
      case '/api/vitals':
        return await MockBackendService.getVitals();

      case '/api/predict':
        if (method === 'POST' && body) {
          return await MockBackendService.predict(body);
        }
        break;

      case '/api/wellness-plan':
        if (method === 'POST' && body) {
          return await MockBackendService.generateWellnessPlan(
            body.userData,
            body.vitals,
            body.riskLevel
          );
        }
        break;

      case '/api/predictions':
        return MockBackendService.getPredictions();

      case '/api/sensor-info':
        return MockBackendService.getSensorInfo();

      case '/api/ai-model-info':
        return {
          model_version: "v3.0-ensemble-demo",
          features: [
            "Ensemble stacking with 4 specialized models",
            "Cardiovascular risk assessment",
            "Respiratory health analysis",
            "Metabolic risk evaluation",
            "General health pattern recognition",
            "SHAP-like explainability",
            "Confidence intervals",
            "Demo mode for deployment"
          ],
          specialized_models: {
            cardiovascular: {
              focus: "Heart rate and blood pressure analysis",
              weight: 0.3,
              conditions: ["Tachycardia", "Bradycardia", "Hypertension"]
            },
            respiratory: {
              focus: "Oxygen saturation and breathing patterns",
              weight: 0.25,
              conditions: ["Hypoxemia", "Respiratory distress"]
            },
            metabolic: {
              focus: "Temperature and metabolic indicators",
              weight: 0.25,
              conditions: ["Fever", "Hypothermia", "Metabolic stress"]
            },
            general: {
              focus: "Overall health pattern analysis",
              weight: 0.2,
              conditions: ["Multi-system dysfunction"]
            }
          }
        };

      default:
        throw new Error(`Mock endpoint not implemented: ${endpoint}`);
    }

    throw new Error(`Invalid request: ${method} ${endpoint}`);
  }

  // Public API methods
  async getVitals() {
    return this.makeRequest('/api/vitals');
  }

  async predict(vitalsData: any) {
    return this.makeRequest('/api/predict', {
      method: 'POST',
      body: JSON.stringify(vitalsData),
    });
  }

  async generateWellnessPlan(userData: any, vitals: any, riskLevel: string, healthHistory: any[] = []) {
    return this.makeRequest('/api/wellness-plan', {
      method: 'POST',
      body: JSON.stringify({ userData, vitals, riskLevel, healthHistory }),
    });
  }

  async getPredictions() {
    return this.makeRequest('/api/predictions');
  }

  async getSensorInfo() {
    return this.makeRequest('/api/sensor-info');
  }

  async getAIModelInfo() {
    return this.makeRequest('/api/ai-model-info');
  }
}

export const apiClient = new ApiClient();