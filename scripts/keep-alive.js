const fs = require('fs');
const https = require('https');
const path = require('path');

let supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si no estamos en GitHub Actions y faltan variables, intentar cargarlas de .env.local
if (!process.env.GITHUB_ACTIONS && (!supabaseUrl || !supabaseAnonKey)) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      console.log("Cargando credenciales locales desde .env.local...");
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
      const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
      if (urlMatch && !supabaseUrl) supabaseUrl = urlMatch[1].trim();
      if (keyMatch && !supabaseAnonKey) supabaseAnonKey = keyMatch[1].trim();
    }
  } catch (err) {
    console.warn("Advertencia: No se pudo leer el archivo .env.local:", err.message);
  }
}

// Validar que las credenciales no estén vacías
if (!supabaseUrl) {
  console.error("\x1b[31mError: Falta la URL de Supabase.\x1b[0m");
  console.error("Asegúrate de configurar la variable de entorno 'SUPABASE_URL' o 'NEXT_PUBLIC_SUPABASE_URL' en los secrets de GitHub.");
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error("\x1b[31mError: Falta la Anon Key de Supabase.\x1b[0m");
  console.error("Asegúrate de configurar la variable de entorno 'SUPABASE_ANON_KEY' o 'NEXT_PUBLIC_SUPABASE_ANON_KEY' en los secrets de GitHub.");
  process.exit(1);
}

// Limpiar la URL de barras diagonales al final
const cleanUrl = supabaseUrl.replace(/\/$/, "");
const timestamp = new Date().toISOString();

// Realizar consulta GET simple para activar la base de datos (SELECT en perfiles)
const testUrl = `${cleanUrl}/rest/v1/perfiles?select=id&created_at=lt.${timestamp}&limit=1`;

console.log(`Ping a la base de datos de Supabase en: ${cleanUrl}`);
try {
  const urlObj = new URL(cleanUrl);
  const hostname = urlObj.hostname;
  const parts = hostname.split('.');
  if (parts.length > 0) {
    const projectSubdomain = parts[0];
    if (projectSubdomain.length > 6) {
      const maskedSubdomain = `${projectSubdomain.substring(0, 4)}...${projectSubdomain.substring(projectSubdomain.length - 4)}`;
      console.log(`[Depuración] ID del proyecto destino detectado: ${maskedSubdomain}`);
    } else {
      console.log(`[Depuración] Host de destino detectado: ${hostname}`);
    }
  }
} catch (e) {
  console.log("No se pudo parsear la URL para el log seguro:", e.message);
}
console.log(`Consulta: rest/v1/perfiles?select=id&created_at=lt.${timestamp}&limit=1`);

const options = {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Cache-Control': 'no-cache'
  }
};

const req = https.get(testUrl, options, (res) => {
  console.log("Código de Estado HTTP:", res.statusCode);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("\x1b[32m¡Éxito! Actividad registrada correctamente en la base de datos de Supabase.\x1b[0m");
      try {
        const parsed = JSON.parse(body);
        console.log(`Registros encontrados: ${parsed.length}`);
      } catch (e) {
        console.log("Cuerpo de la respuesta:", body);
      }
      process.exit(0);
    } else {
      console.error(`\x1b[31mError: Supabase respondió con código de estado ${res.statusCode}\x1b[0m`);
      console.error("Cuerpo de la respuesta:", body);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error("\x1b[31mError en la petición de red:\x1b[0m", err.message);
  process.exit(1);
});
