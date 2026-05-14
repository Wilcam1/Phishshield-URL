import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AnalysisCache {
    constructor(ttlMinutes = 60) {
        this.cacheFile = path.join(__dirname, '../../cache.json');
        this.ttl = ttlMinutes * 60 * 1000;
        this.cache = this._loadCache();
    }

    _loadCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                // Limpiar entradas expiradas al cargar
                const now = Date.now();
                const validCache = {};
                
                Object.keys(data).forEach(url => {
                    if (now - data[url].timestamp < this.ttl) {
                        validCache[url] = data[url];
                    }
                });
                return validCache;
            }
        } catch (error) {
            console.error('❌ Error cargando caché:', error.message);
        }
        return {};
    }

    _saveCache() {
        try {
            fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
        } catch (error) {
            console.error('❌ Error guardando caché:', error.message);
        }
    }

    get(url) {
        const entry = this.cache[url];
        if (entry) {
            if (Date.now() - entry.timestamp < this.ttl) {
                console.log('💎 Caché hit para:', url);
                return entry.data;
            } else {
                delete this.cache[url]; // Expirado
                this._saveCache();
            }
        }
        return null;
    }

    set(url, data) {
        this.cache[url] = {
            timestamp: Date.now(),
            data: data
        };
        this._saveCache();
    }

    invalidate(url) {
        if (this.cache[url]) {
            delete this.cache[url];
            this._saveCache();
        }
    }

    invalidateByDomain(domain) {
        let changed = false;
        Object.keys(this.cache).forEach(url => {
            try {
                const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                if (urlObj.hostname === domain) {
                    delete this.cache[url];
                    changed = true;
                }
            } catch(e) {}
        });
        if (changed) this._saveCache();
    }
}

export default AnalysisCache;
