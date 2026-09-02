import axios from 'axios';

const testUrls = [
  // Legítimos
  { url: 'google.com', expected: 'bajo' },
  { url: 'bancolombia.com', expected: 'bajo' },
  // Combosquatting / Suplantación
  { url: 'bancolombia-login-secure.xyz', expected: 'alto' },
  // Typosquatting (Levenshtein)
  { url: 'bancolornbia.com', expected: 'alto' },
  // Homógrafos Unicode (Cyrillic a)
  { url: 'bаncolombia.com', expected: 'alto' }, // Esta 'а' es cirílica U+0430
  // IP / HTTP
  { url: 'http://192.168.1.1/login', expected: 'medio' }
];

async function runTests() {
  console.log('🧪 Iniciando pruebas de integración del análisis de URLs...');
  console.log('-----------------------------------------------------------');

  for (const test of testUrls) {
    try {
      console.log(`🔍 Probando: "${test.url}"`);
      const response = await axios.post('http://localhost:3001/analizar', {
        url: test.url
      });

      const { riesgo, puntuacion, probabilidad_ml, indicadores, factores_puntuacion } = response.data;
      
      console.log(`   - Riesgo calculado: ${riesgo.toUpperCase()} (Puntuación: ${puntuacion}/10)`);
      console.log(`   - Probabilidad ML: ${probabilidad_ml !== null ? (probabilidad_ml * 100).toFixed(1) + '%' : 'N/A'}`);
      console.log(`   - Indicadores:`, indicadores);
      console.log(`   - Factores de puntuación:`, factores_puntuacion);
      console.log('-----------------------------------------------------------');
    } catch (error) {
      console.error(`❌ Error analizando "${test.url}":`, error.message);
      if (error.response) {
        console.error('   Detalles:', error.response.data);
      }
    }
  }
}

runTests();
