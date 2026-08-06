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

function runPing() {
  console.log(`Ping a la base de datos de Supabase en: ${cleanUrl}`);
  
  // Imprimir ID de proyecto de forma segura para depuración
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

  // Intentar primero escribir en la tabla 'keep_alive_pings'
  const postUrl = `${cleanUrl}/rest/v1/keep_alive_pings`;
  const postOptions = {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      'Cache-Control': 'no-cache'
    }
  };

  console.log("Intentando ping de escritura en tabla 'keep_alive_pings'...");
  
  const reqWrite = https.request(postUrl, postOptions, (resWrite) => {
    let bodyWrite = '';
    resWrite.on('data', (chunk) => { bodyWrite += chunk; });
    resWrite.on('end', () => {
      if (resWrite.statusCode >= 200 && resWrite.statusCode < 300) {
        console.log("\x1b[32m¡Éxito! Ping de ESCRITURA registrado correctamente en 'keep_alive_pings'.\x1b[0m");
        runReadPing();
      } else {
        console.log(`El ping de escritura devolvió código ${resWrite.statusCode}. Procediendo con consulta de lectura de fallback...`);
        runFallbackRead();
      }
    });
  });

  reqWrite.on('error', (err) => {
    console.log("Error en el ping de escritura:", err.message, ". Procediendo con consulta de lectura de fallback...");
    runFallbackRead();
  });

  reqWrite.write(JSON.stringify({}));
  reqWrite.end();
}

function runReadPing() {
  const getUrl = `${cleanUrl}/rest/v1/keep_alive_pings?select=*&limit=1`;
  console.log("Ejecutando consulta de LECTURA de validación en 'keep_alive_pings'...");

  const getOptions = {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Cache-Control': 'no-cache'
    }
  };

  const reqRead = https.get(getUrl, getOptions, (resRead) => {
    let bodyRead = '';
    resRead.on('data', (chunk) => { bodyRead += chunk; });
    resRead.on('end', () => {
      if (resRead.statusCode >= 200 && resRead.statusCode < 300) {
        console.log("\x1b[32m¡Éxito! Consulta de LECTURA en 'keep_alive_pings' ejecutada correctamente.\x1b[0m");
        try {
          const parsed = JSON.parse(bodyRead);
          console.log(`Registros leídos: ${parsed.length}`);
        } catch (e) {
          console.log("Cuerpo de la respuesta:", bodyRead);
        }
        process.exit(0);
      } else {
        console.log(`La lectura de validación en 'keep_alive_pings' devolvió código ${resRead.statusCode}. Procediendo con fallback...`);
        runFallbackRead();
      }
    });
  });

  reqRead.on('error', (err) => {
    console.log("Error en la lectura de validación:", err.message, ". Procediendo con fallback...");
    runFallbackRead();
  });
}

function runFallbackRead() {
  const testUrl = `${cleanUrl}/rest/v1/perfiles?select=id&created_at=lt.${timestamp}&limit=1`;
  console.log(`Ejecutando fallback de LECTURA: rest/v1/perfiles?select=id&created_at=lt.${timestamp}&limit=1`);

  const options = {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Cache-Control': 'no-cache'
    }
  };

  const reqRead = https.get(testUrl, options, (resRead) => {
    console.log("Código de Estado HTTP (Lectura):", resRead.statusCode);
    let bodyRead = '';
    resRead.on('data', (chunk) => { bodyRead += chunk; });
    resRead.on('end', () => {
      if (resRead.statusCode >= 200 && resRead.statusCode < 300) {
        console.log("\x1b[32m¡Éxito! Actividad de LECTURA registrada correctamente (perfiles).\x1b[0m");
        try {
          const parsed = JSON.parse(bodyRead);
          console.log(`Registros encontrados: ${parsed.length}`);
        } catch (e) {
          console.log("Cuerpo de la respuesta:", bodyRead);
        }
        process.exit(0);
      } else {
        console.error(`\x1b[31mError: Supabase respondió con código de estado ${resRead.statusCode} en la lectura\x1b[0m`);
        console.error("Cuerpo de la respuesta:", bodyRead);
        process.exit(1);
      }
    });
  });

  reqRead.on('error', (err) => {
    console.error("\x1b[31mError en la petición de red (Lectura):\x1b[0m", err.message);
    process.exit(1);
  });
}

runPing();
