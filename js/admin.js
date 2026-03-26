// Logic for Admin Dashboard

const inputs = {
    name: document.getElementById('input_name'),
    username: document.getElementById('input_username'),
    bio: document.getElementById('input_bio'),
    photos: document.getElementById('input_photos'),
    videos: document.getElementById('input_videos'),
    locks: document.getElementById('input_locks'),
    hearts: document.getElementById('input_hearts'),
    avatar: document.getElementById('input_avatar'),
    cover: document.getElementById('input_cover'),
    price1: document.getElementById('input_price1'),
    price3: document.getElementById('input_price3'),
    price6: document.getElementById('input_price6'),
    link1: document.getElementById('input_link1'),
    link3: document.getElementById('input_link3'),
    link6: document.getElementById('input_link6'),
    video_feed: document.getElementById('input_video'), // Renomeado para evitar conflitos
    cookies: document.getElementById('input_cookies'),
    instagram: document.getElementById('input_instagram'),
    langBtn: document.getElementById('input_lang_btn'),
    
    // New Media fields
    media1: document.getElementById('input_media1'),
    media2: document.getElementById('input_media2'),
    media3: document.getElementById('input_media3'),
    media4: document.getElementById('input_media4'),
    media5: document.getElementById('input_media5'),
    
    // New Checkout Customization fields
    ck_banner: document.getElementById('input_ck_banner'),
    ck_avatar: document.getElementById('input_ck_avatar'),
    ck_minitext: document.getElementById('input_ck_minitext'),
    ck_anchor: document.getElementById('input_ck_anchor'),
    ck_timer_on: document.getElementById('input_ck_timer_on'),
    ck_time: document.getElementById('input_ck_time'),
    
    // SyncPay Config
    syncpay_id: document.getElementById('input_syncpay_id'),
    syncpay_secret: document.getElementById('input_syncpay_secret'),
    syncpay_url: document.getElementById('input_syncpay_url')
};

const uploads = {
    avatar: document.getElementById('upload_avatar_file'),
    cover: document.getElementById('upload_cover_file'),
    video: document.getElementById('upload_video_file'),
    media1: document.getElementById('upload_media1_file'),
    media2: document.getElementById('upload_media2_file'),
    media3: document.getElementById('upload_media3_file'),
    media4: document.getElementById('upload_media4_file'),
    media5: document.getElementById('upload_media5_file'),
    ck_banner: document.getElementById('upload_ck_banner_file'),
    ck_avatar: document.getElementById('upload_ck_avatar_file')
};

const iframe = document.getElementById('preview_iframe');

// Load saved data from Server
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/load-config');
        const data = await response.json();
        
        // If server has data, use it. Otherwise try localStorage as fallback.
        const finalData = Object.keys(data).length > 0 ? data : JSON.parse(localStorage.getItem('profileData') || '{}');

        if (finalData) {
            if(inputs.name) inputs.name.value = finalData.n || '';
            if(inputs.username) inputs.username.value = finalData.u || '';
            if(inputs.bio) inputs.bio.value = finalData.b || '';
            if(inputs.photos) inputs.photos.value = finalData.ph || '';
            if(inputs.videos) inputs.videos.value = finalData.vi || '';
            if(inputs.locks) inputs.locks.value = finalData.lo || '';
            if(inputs.hearts) inputs.hearts.value = finalData.he || '';
            if(inputs.avatar) inputs.avatar.value = finalData.av || '';
            if(inputs.cover) inputs.cover.value = finalData.co || '';
            if(inputs.price1) inputs.price1.value = finalData.p1 || '';
            if(inputs.price3) inputs.price3.value = finalData.p3 || '';
            if(inputs.price6) inputs.price6.value = finalData.p6 || '';
            if(inputs.link1) inputs.link1.value = finalData.l1 || '';
            if(inputs.link3) inputs.link3.value = finalData.l3 || '';
            if(inputs.link6) inputs.link6.value = finalData.l6 || '';
            if(inputs.video_feed) inputs.video_feed.value = finalData.vd || '';
            if(inputs.cookies) inputs.cookies.checked = finalData.ck !== false;
            if(inputs.instagram) inputs.instagram.value = finalData.ig || '';
            if(inputs.langBtn) inputs.langBtn.checked = finalData.lb !== false;
            
            if(inputs.media1) inputs.media1.value = finalData.m1 || '';
            if(inputs.media2) inputs.media2.value = finalData.m2 || '';
            if(inputs.media3) inputs.media3.value = finalData.m3 || '';
            if(inputs.media4) inputs.media4.value = finalData.m4 || '';
            if(inputs.media5) inputs.media5.value = finalData.m5 || '';
            
            if(inputs.ck_banner) inputs.ck_banner.value = finalData.ckb || '';
            if(inputs.ck_avatar) inputs.ck_avatar.value = finalData.cka || '';
            if(inputs.ck_minitext) inputs.ck_minitext.value = finalData.ckmt || 'Cobrado de forma segura';
            if(inputs.ck_anchor) inputs.ck_anchor.value = finalData.ckanc || 'R$ 149,99';
            if(inputs.ck_timer_on) inputs.ck_timer_on.checked = finalData.ckton !== false;
            if(inputs.ck_time) inputs.ck_time.value = finalData.ckt || '15';

            if(inputs.syncpay_id) inputs.syncpay_id.value = finalData.syncpay_id || '';
            if(inputs.syncpay_secret) inputs.syncpay_secret.value = finalData.syncpay_secret || '';
            if(inputs.syncpay_url) inputs.syncpay_url.value = finalData.syncpay_url || 'https://api.syncpayments.com.br';
        }
    } catch (e) {
        console.error('Erro ao carregar do servidor:', e);
    }
    updatePreview();
});

// Adiciona listener para carregar o preview quando o iframe terminar de carregar
if (iframe) {
    iframe.onload = () => {
        console.log('✅ Iframe carregado, enviando dados iniciais...');
        updatePreview();
    };
}

// Update preview on any input change
Object.values(inputs).forEach(input => {
    if(input) {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    }
});

// Handle File Uploads - NOVO (Envia para o Servidor)
Object.keys(uploads).forEach(key => {
    if(uploads[key]) {
        uploads[key].addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const label = e.target.previousElementSibling;
            const originalIcon = label.innerHTML;
            label.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                
                if (result.url) {
                    const fileUrl = result.url; // Use caminho relativo (/uploads/...)
                    
                    // Mapeamento direto
                    if (key === 'avatar') inputs.avatar.value = fileUrl;
                    else if (key === 'cover') inputs.cover.value = fileUrl;
                    else if (key === 'video') inputs.video_feed.value = fileUrl;
                    else if (key === 'media1') inputs.media1.value = fileUrl;
                    else if (key === 'media2') inputs.media2.value = fileUrl;
                    else if (key === 'media3') inputs.media3.value = fileUrl;
                    else if (key === 'media4') inputs.media4.value = fileUrl;
                    else if (key === 'media5') inputs.media5.value = fileUrl;
                    else if (key === 'ck_banner') inputs.ck_banner.value = fileUrl;
                    else if (key === 'ck_avatar') inputs.ck_avatar.value = fileUrl;
                    
                    label.innerHTML = '<i class="fas fa-check"></i>';
                } else {
                    throw new Error('Falha no upload');
                }
            } catch (err) {
                console.error(err);
                label.innerHTML = '<i class="fas fa-times"></i>';
            } finally {
                setTimeout(() => label.innerHTML = originalIcon, 2000);
                updatePreview();
            }
        });
    }
});

function getData() {
    return {
        n: inputs.name ? inputs.name.value : '',
        u: inputs.username ? inputs.username.value : '',
        b: inputs.bio ? inputs.bio.value : '',
        ph: inputs.photos ? inputs.photos.value : '',
        vi: inputs.videos ? inputs.videos.value : '',
        lo: inputs.locks ? inputs.locks.value : '',
        he: inputs.hearts ? inputs.hearts.value : '',
        av: inputs.avatar ? inputs.avatar.value : '',
        co: inputs.cover ? inputs.cover.value : '',
        p1: inputs.price1 ? inputs.price1.value : '',
        p3: inputs.price3 ? inputs.price3.value : '',
        p6: inputs.price6 ? inputs.price6.value : '',
        l1: inputs.link1 ? inputs.link1.value : '',
        l3: inputs.link3 ? inputs.link3.value : '',
        l6: inputs.link6 ? inputs.link6.value : '',
        vd: inputs.video_feed ? inputs.video_feed.value : '',
        ck: inputs.cookies ? inputs.cookies.checked : true,
        ig: inputs.instagram ? inputs.instagram.value : '',
        lb: inputs.langBtn ? inputs.langBtn.checked : true,
        bl: inputs.video_feed ? inputs.video_feed.value : '', // Agora o blur segue a mídia do feed
        
        m1: inputs.media1 ? inputs.media1.value : '',
        m2: inputs.media2 ? inputs.media2.value : '',
        m3: inputs.media3 ? inputs.media3.value : '',
        m4: inputs.media4 ? inputs.media4.value : '',
        m5: inputs.media5 ? inputs.media5.value : '',
        
        ckb: inputs.ck_banner ? inputs.ck_banner.value : '',
        cka: inputs.ck_avatar ? inputs.ck_avatar.value : '',
        ckmt: inputs.ck_minitext ? inputs.ck_minitext.value : '',
        ckanc: inputs.ck_anchor ? inputs.ck_anchor.value : '',
        ckton: inputs.ck_timer_on ? inputs.ck_timer_on.checked : true,
        ckt: inputs.ck_time ? inputs.ck_time.value : '',
        
        syncpay_id: inputs.syncpay_id ? inputs.syncpay_id.value : '',
        syncpay_secret: inputs.syncpay_secret ? inputs.syncpay_secret.value : '',
        syncpay_url: inputs.syncpay_url ? inputs.syncpay_url.value : ''
    };
}

function updatePreview(forceReload = false) {
    console.log('🔄 Atualizando Preview...');
    const data = getData();
    
    if (forceReload && iframe) {
        const currentSrc = iframe.src;
        iframe.src = '';
        iframe.src = currentSrc;
        return; // O iframe.onload se encarregará de chamar updatePreview() novamente
    }

    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'UPDATE_PROFILE', data }, '*');
    }
}

async function saveData(e) {
    const data = getData();
    const btn = (e && e.currentTarget) || (window.event && window.event.currentTarget) || document.querySelector('button[onclick*="saveData"]');
    const originalText = btn ? btn.innerHTML : 'Salvar';

    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btn.disabled = true;
    }

    try {
        const response = await fetch('/api/save-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            // Salva no localStorage como backup local para o preview imediato
            localStorage.setItem('profileData', JSON.stringify(data));
            
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
                btn.style.background = '#28a745';
            }
        } else {
            throw new Error('Erro ao salvar no servidor');
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar no servidor. Usando cache local temporário.');
        localStorage.setItem('profileData', JSON.stringify(data));
    } finally {
        if (btn) {
            btn.disabled = false;
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '#444';
            }, 2000);
        }
        updatePreview();
    }
}

function generateLink() {
    const data = getData();
    const jsonStr = JSON.stringify(data);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    const url = new URL(window.location.href);
    const path = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
    const finalUrl = `${url.origin}${path}profile.html?d=${encodeURIComponent(encoded)}`;

    copyToClipboard(finalUrl).then(() => {
        alert('Link gerado e copiado!');
    }).catch(err => {
        prompt('Link gerado (Copie manualmente):', finalUrl);
    });
}

function copyToClipboard(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text);
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve();
}

async function exportZip() {
    const data = getData();

    if (!data.syncpay_id || !data.syncpay_secret) {
        if (!confirm('ATENÇÃO: Você não preencheu as Configurações SyncPay. O pagamento no ZIP exportado NÃO funcionará até você configurar. Deseja baixar assim mesmo?')) {
            return;
        }
    }

    localStorage.setItem('profileData', JSON.stringify(data));
    const zip = new JSZip();
    
    const btn = document.querySelector('button[onclick="exportZip()"]');
    const originalText = btn ? btn.innerHTML : 'ZIP';
    if(btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        btn.disabled = true;
    }

    try {
        // 1. Fetch de arquivos básicos
        const response = await fetch('profile.html');
        let htmlContent = await response.text();
        
        // Sanatize data for ZIP (convert absolute URLs to relative)
        const zipData = JSON.parse(JSON.stringify(data));
        const mediaUrls = [];

        const sanitizeUrl = (url) => {
            if (!url || typeof url !== 'string') return url;
            if (url.includes('/uploads/')) {
                const relativePath = 'uploads/' + url.split('/uploads/').pop();
                mediaUrls.push({ original: url, zipPath: relativePath });
                return relativePath;
            }
            return url;
        };

        // Mapear todos os campos de mídia
        const mediaKeys = ['av', 'co', 'vd', 'bl', 'm1', 'm2', 'm3', 'm4', 'm5', 'ckb', 'cka'];
        mediaKeys.forEach(k => { zipData[k] = sanitizeUrl(zipData[k]); });

        // Ensure SyncPay keys are in the preloaded data for the ZIP's .env.example
        zipData.syncpay_id = inputs.syncpay_id ? inputs.syncpay_id.value : '';
        zipData.syncpay_secret = inputs.syncpay_secret ? inputs.syncpay_secret.value : '';
        zipData.syncpay_url = inputs.syncpay_url ? inputs.syncpay_url.value : 'https://api.syncpayments.com.br';

        const scriptBake = `
        <script>
            const preloadedData = ${JSON.stringify(zipData)};
            window.addEventListener('load', () => {
                if (typeof loadProfile === 'function') loadProfile(preloadedData);
            });
        <\/script>
        `;
        htmlContent = htmlContent.replace('</body>', scriptBake + '</body>');
        zip.file("index.html", htmlContent);
        
        const assets = [
            'css/premium.css', 
            'css/suitpay_checkout.css', 
            'js/suitpay_checkout.js', 
            'images/logo-black.svg', 
            'checkout.php',
            'api/load-config.php',
            'api/save-config.php',
            'api/upload.php'
        ];
        for (const file of assets) {
            try {
                const res = await fetch(file);
                if (res.ok) {
                    let content;
                    if (file === 'checkout.php') {
                        content = await res.text();
                        content = content.replace('%%CLIENT_ID%%', zipData.syncpay_id || '');
                        content = content.replace('%%CLIENT_SECRET%%', zipData.syncpay_secret || '');
                        content = content.replace('%%BASE_URL%%', zipData.syncpay_url || 'https://api.syncpayments.com.br');
                    } else {
                        content = await res.blob();
                    }
                    zip.file(file, content);
                }
            } catch(e) {
                console.warn(`Falha ao incluir ${file} no ZIP:`, e);
            }
        }

        // 1.5 Criar um .env de exemplo para o usuário saber o que configurar
        const envExample = `# Configurações do SyncPay (Preencha com seus dados)
SYNCPAY_CLIENT_ID=${zipData.syncpay_id || 'SEU_CLIENT_ID'}
SYNCPAY_CLIENT_SECRET=${zipData.syncpay_secret || 'SEU_CLIENT_SECRET'}
SYNCPAY_BASE_URL=https://api.syncpayments.com.br
PORT=3000
`;
        zip.file(".env.example", envExample);
        zip.file("LEIA-ME.txt", "Para o site funcionar no InfinityFree / Hostinger:\n1. Suba todos os arquivos da pasta htdocs (ou a raiz do ZIP).\n2. Certifique-se de que a pasta 'api/' e 'uploads/' foram enviadas.\n3. O checkout.php já está configurado com suas credenciais.\n4. Se o Admin não salvar, verifique se o arquivo 'db.json' tem permissão de escrita (777 ou 755).");

        // 2. Fetch e inclusão de mídias (uploads/)
        console.log('📦 Coletando mídias para o ZIP...');
        for (const media of mediaUrls) {
            try {
                const res = await fetch(media.original);
                if (res.ok) {
                    zip.file(media.zipPath, await res.blob());
                }
            } catch(e) {
                console.warn('Falha ao incluir mídia no ZIP:', media.original);
            }
        }
        
        const content = await zip.generateAsync({type:"blob"});
        saveAs(content, `perfil_${data.n.toLowerCase().replace(/\s+/g, '_')}.zip`);
    } catch (e) {
        console.error(e);
        alert('Erro ao gerar ZIP. Tente o Link.');
    } finally {
        if(btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}
