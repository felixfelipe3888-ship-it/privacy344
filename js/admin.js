// Logic for Admin Dashboard

// Password Protection
(function() {
    const pass = prompt('Digite a senha de administrador:');
    if (pass !== '6677') {
        alert('Senha incorreta!');
        window.location.href = 'index.html';
    } else {
        document.body.style.display = 'flex';
    }
})();


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
    ck_video: document.getElementById('input_ck_video'),
    
    // Order Bump fields
    ck_ob_on: document.getElementById('input_ck_ob_on'),
    ck_ob_title: document.getElementById('input_ck_ob_title'),
    ck_ob_text: document.getElementById('input_ck_ob_text'),
    ck_ob_price: document.getElementById('input_ck_ob_price'),
    ck_ob_img: document.getElementById('input_ck_ob_img'),
    
    // PushinPay Token field (reused from syncpay_secret in db.json for compatibility)
    pushinpay_token: document.getElementById('input_syncpay_secret'),
    after_pay_link: document.getElementById('input_after_pay_link')
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
    ck_avatar: document.getElementById('upload_ck_avatar_file'),
    ck_video: document.getElementById('upload_ck_video_file'),
    ck_ob_img: document.getElementById('upload_ck_ob_img_file')
};

const iframe = document.getElementById('preview_iframe');

// Load saved data from Server
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/load-config');
        const data = await response.json();
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
            if(inputs.ck_video) inputs.ck_video.value = finalData.ckvid || '';

            if(inputs.ck_ob_on) inputs.ck_ob_on.checked = finalData.ckobon === true;
            if(inputs.ck_ob_title) inputs.ck_ob_title.value = finalData.ckobt || '';
            if(inputs.ck_ob_text) inputs.ck_ob_text.value = finalData.ckobx || '';
            if(inputs.ck_ob_price) inputs.ck_ob_price.value = finalData.ckobp || '';
            if(inputs.ck_ob_img) inputs.ck_ob_img.value = finalData.ckobi || '';

            if(inputs.pushinpay_token) inputs.pushinpay_token.value = ''; // token não é retornado pela API por segurança
            if(inputs.after_pay_link) inputs.after_pay_link.value = finalData.apl || '';
        }
    } catch (e) {
        console.error('Erro ao carregar do servidor:', e);
    }
    updatePreview();
});

if (iframe) {
    iframe.onload = () => updatePreview();
}

Object.values(inputs).forEach(input => {
    if(input) {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    }
});

// ─── Upload direto para Imgur (sem passar pelo servidor) ─────────────────────
// Client ID público anônimo do Imgur — funciona sem criar conta.
const IMGUR_CLIENT_ID = 'Client-ID 546c25a59c58ad7';

async function uploadToImgur(file) {
    const fd = new FormData();
    fd.append('image', file);
    const r = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: { 'Authorization': IMGUR_CLIENT_ID },
        body: fd
    });
    if (!r.ok) throw new Error('Imgur HTTP ' + r.status);
    const json = await r.json();
    if (!json.success) throw new Error('Imgur: ' + (json.data?.error || 'erro desconhecido'));
    return json.data.link;
}

async function uploadToFreeImageHost(file) {
    // Fallback: freeimage.host API pública
    const fd = new FormData();
    fd.append('source', file);
    fd.append('type', 'file');
    const r = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a2&action=upload', {
        method: 'POST',
        body: fd
    });
    if (!r.ok) throw new Error('FreeImage HTTP ' + r.status);
    const json = await r.json();
    if (json.status_code !== 200) throw new Error('FreeImage: erro ' + json.status_code);
    return json.image.url;
}

// ─── Upload de VÍDEO: 0x0.st (primário) → Litterbox (fallback) ───────────────
async function uploadToZeroX(file) {
    // 0x0.st: suporta qualquer arquivo até 512 MB, retorna URL direta do .mp4
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('https://0x0.st', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('0x0.st HTTP ' + r.status);
    const url = (await r.text()).trim();
    if (!url.startsWith('http')) throw new Error('0x0.st resposta inválida');
    return url;
}

async function uploadToLitterbox(file) {
    // Litterbox: suporta vídeos grandes (72h de duração temporária)
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('time', '72h');
    fd.append('fileToUpload', file);
    const r = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: fd
    });
    if (!r.ok) throw new Error('Litterbox HTTP ' + r.status);
    const url = (await r.text()).trim();
    if (!url.startsWith('http')) throw new Error('Litterbox resposta inválida');
    return url;
}

async function uploadMedia(file) {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);

    if (isVideo) {
        // Vídeos: 0x0.st → Litterbox
        try {
            return await uploadToZeroX(file);
        } catch (e1) {
            console.warn('0x0.st falhou, tentando Litterbox...', e1.message);
            try {
                return await uploadToLitterbox(file);
            } catch (e2) {
                throw new Error('Falha no upload do vídeo.\n• 0x0.st: ' + e1.message + '\n• Litterbox: ' + e2.message);
            }
        }
    } else {
        // Imagens: Imgur → freeimage.host
        try {
            return await uploadToImgur(file);
        } catch (e1) {
            console.warn('Imgur falhou, tentando fallback...', e1.message);
            try {
                return await uploadToFreeImageHost(file);
            } catch (e2) {
                throw new Error('Falha no upload da imagem.\n• Imgur: ' + e1.message + '\n• FreeImage: ' + e2.message);
            }
        }
    }
}

// File Uploads
Object.keys(uploads).forEach(key => {
    if(uploads[key]) {
        uploads[key].addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
            const maxSize = isVideo ? 512 * 1024 * 1024 : 32 * 1024 * 1024;
            const maxLabel = isVideo ? '512 MB' : '32 MB';

            if (file.size > maxSize) {
                alert(`Arquivo muito grande! O limite para ${isVideo ? 'vídeos' : 'imagens'} é ${maxLabel}.\nComprima o arquivo e tente novamente.`);
                e.target.value = '';
                return;
            }

            const label = e.target.previousElementSibling;
            const originalIcon = label.innerHTML;
            label.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            label.title = isVideo ? 'Enviando vídeo (pode demorar)...' : 'Enviando imagem...';

            try {
                const fileUrl = await uploadMedia(file);
                
                // Mapear chave → input
                const inputMap = {
                    avatar: inputs.avatar,
                    cover: inputs.cover,
                    video: inputs.video_feed,
                    media1: inputs.media1,
                    media2: inputs.media2,
                    media3: inputs.media3,
                    media4: inputs.media4,
                    media5: inputs.media5,
                    ck_banner: inputs.ck_banner,
                    ck_avatar: inputs.ck_avatar,
                    ck_video: inputs.ck_video,
                    ck_ob_img: inputs.ck_ob_img,
                };
                if (inputMap[key]) inputMap[key].value = fileUrl;
                
                label.innerHTML = '<i class="fas fa-check"></i>';
                label.style.background = '#28a745';
                updatePreview();
            } catch (err) {
                console.error('Erro no upload:', err);
                alert('❌ Erro ao enviar arquivo:\n' + err.message + '\n\nDica: Você também pode colar o link direto no campo de texto.');
                label.innerHTML = '<i class="fas fa-times"></i>';
                label.style.background = '#dc3545';
            } finally {
                e.target.value = '';
                setTimeout(() => {
                    label.innerHTML = originalIcon;
                    label.style.background = '#555';
                    label.title = '';
                }, 2500);
            }
        });
    }
});

function getData() {
    const clean = (url) => {
        if (!url || typeof url !== 'string') return url;
        // Remove localhost ou o domínio atual se for absoluto
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === window.location.hostname || urlObj.hostname === 'localhost') {
                return urlObj.pathname + urlObj.search + urlObj.hash;
            }
        } catch (e) { }
        return url.replace(/https?:\/\/[^\/]+/i, (match) => {
            if (match.includes(window.location.hostname) || match.includes('localhost')) return '';
            return match;
        });
    };

    return {
        n: inputs.name ? inputs.name.value : '',
        u: inputs.username ? inputs.username.value : '',
        b: inputs.bio ? inputs.bio.value : '',
        ph: inputs.photos ? inputs.photos.value : '',
        vi: inputs.videos ? inputs.videos.value : '',
        lo: inputs.locks ? inputs.locks.value : '',
        he: inputs.hearts ? inputs.hearts.value : '',
        av: clean(inputs.avatar ? inputs.avatar.value : ''),
        co: clean(inputs.cover ? inputs.cover.value : ''),
        p1: inputs.price1 ? inputs.price1.value : '',
        p3: inputs.price3 ? inputs.price3.value : '',
        p6: inputs.price6 ? inputs.price6.value : '',
        l1: inputs.link1 ? inputs.link1.value : '',
        l3: inputs.link3 ? inputs.link3.value : '',
        l6: inputs.link6 ? inputs.link6.value : '',
        vd: clean(inputs.video_feed ? inputs.video_feed.value : ''),
        ck: inputs.cookies ? inputs.cookies.checked : true,
        ig: inputs.instagram ? inputs.instagram.value : '',
        lb: inputs.langBtn ? inputs.langBtn.checked : true,
        bl: clean(inputs.video_feed ? inputs.video_feed.value : ''),
        m1: clean(inputs.media1 ? inputs.media1.value : ''),
        m2: clean(inputs.media2 ? inputs.media2.value : ''),
        m3: clean(inputs.media3 ? inputs.media3.value : ''),
        m4: clean(inputs.media4 ? inputs.media4.value : ''),
        m5: clean(inputs.media5 ? inputs.media5.value : ''),
        ckb: clean(inputs.ck_banner ? inputs.ck_banner.value : ''),
        cka: clean(inputs.ck_avatar ? inputs.ck_avatar.value : ''),
        ckmt: inputs.ck_minitext ? inputs.ck_minitext.value : '',
        ckanc: inputs.ck_anchor ? inputs.ck_anchor.value : '',
        ckton: inputs.ck_timer_on ? inputs.ck_timer_on.checked : true,
        ckt: inputs.ck_time ? inputs.ck_time.value : '15',
        ckvid: clean(inputs.ck_video ? inputs.ck_video.value : ''),
        ckobon: inputs.ck_ob_on ? inputs.ck_ob_on.checked : false,
        ckobt: inputs.ck_ob_title ? inputs.ck_ob_title.value : '',
        ckobx: inputs.ck_ob_text ? inputs.ck_ob_text.value : '',
        ckobp: inputs.ck_ob_price ? inputs.ck_ob_price.value : '',
        ckobi: clean(inputs.ck_ob_img ? inputs.ck_ob_img.value : ''),
        syncpay_secret: inputs.pushinpay_token ? inputs.pushinpay_token.value : '',
        apl: inputs.after_pay_link ? inputs.after_pay_link.value : ''
    };
}

function updatePreview(forceReload = false) {
    const data = getData();
    if (forceReload && iframe) {
        const currentSrc = iframe.src;
        iframe.src = '';
        iframe.src = currentSrc;
        return;
    }
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'UPDATE_PROFILE', data }, '*');
    }
}

async function saveData(e) {
    const data = getData();
    const btn = (e && e.currentTarget) || document.querySelector('button[onclick*="saveData"]');
    const originalText = btn ? btn.innerHTML : 'Salvar';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
    }
    try {
        const response = await fetch('/api/save-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            localStorage.setItem('profileData', JSON.stringify(data));
            if (btn) { btn.innerHTML = '<i class="fas fa-check"></i>'; btn.style.background = '#28a745'; }
        } else { throw new Error('Erro ao salvar'); }
    } catch (e) {
        console.error(e);
        localStorage.setItem('profileData', JSON.stringify(data));
    } finally {
        if (btn) {
            btn.disabled = false;
            setTimeout(() => { btn.innerHTML = originalText; btn.style.background = '#444'; }, 2000);
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
    const finalUrl = `${url.origin}${path}index.html?d=${encodeURIComponent(encoded)}`;
    navigator.clipboard.writeText(finalUrl).then(() => alert('Link copiado!'));
}

async function exportZip() {
    const data = getData();
    if (!data.syncpay_secret) {
        if (!confirm('Token PushinPay não preenchido. O PIX não funcionará no ZIP. Deseja continuar?')) return;
    }
    const zip = new JSZip();
    const btn = document.querySelector('button[onclick="exportZip()"]');
    if(btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }

    try {
        const response = await fetch('index.html');
        let htmlContent = await response.text();
        const zipData = JSON.parse(JSON.stringify(data));
        const mediaUrls = [];
        const sanitizeUrl = (url) => {
            if (!url || typeof url !== 'string' || !url.includes('/uploads/')) return url;
            const relativePath = 'uploads/' + url.split('/uploads/').pop();
            mediaUrls.push({ original: url, zipPath: relativePath });
            return relativePath;
        };
        const mediaKeys = ['av', 'co', 'vd', 'bl', 'm1', 'm2', 'm3', 'm4', 'm5', 'ckb', 'cka', 'ckobi'];
        mediaKeys.forEach(k => { zipData[k] = sanitizeUrl(zipData[k]); });

        const scriptBake = `<script>const preloadedData = ${JSON.stringify(zipData)}; window.addEventListener('load', () => { if (typeof loadProfile === 'function') loadProfile(preloadedData); });<\/script>`;
        htmlContent = htmlContent.replace('</body>', scriptBake + '</body>');
        zip.file("index.html", htmlContent);
        
        const assets = ['css/premium.css', 'css/checkout.css', 'images/logo-black.svg'];
        for (const file of assets) {
            try {
                const res = await fetch(file);
                if (res.ok) zip.file(file, await res.blob());
            } catch(e) {}
        }

        zip.file("LEIA-ME.txt", "Configuração PushinPay:\n1. Coloque seu TOKEN no arquivo server.js se for rodar via Node.\n2. Este ZIP contém apenas o frontend estático com dados pré-carregados.");

        for (const media of mediaUrls) {
            try {
                const res = await fetch(media.original);
                if (res.ok) zip.file(media.zipPath, await res.blob());
            } catch(e) {}
        }
        
        const content = await zip.generateAsync({type:"blob"});
        saveAs(content, `premium_pushinpay.zip`);
    } catch (error) { alert('Erro ao gerar ZIP'); }
    finally { if(btn) { btn.innerHTML = '<i class="fas fa-file-archive"></i> ZIP'; btn.disabled = false; } }
}
