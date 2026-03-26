// suitpay_checkout.js

let currentPlanPrice = 0;

function syncModalImages() {
    // Tenta pegar do profile primeiro, senao usa fallback
    const coverElement = document.getElementById('prof_cover');
    const avatarElement = document.getElementById('prof_avatar');
    
    if(coverElement && coverElement.src) {
        document.getElementById('suitpayBanner').src = coverElement.src;
    }
    if(avatarElement && avatarElement.src) {
        document.getElementById('suitpayAvatar').src = avatarElement.src;
    }
}

function openSuitPayModal(planName, priceStr) {
    document.getElementById('suitpayPlanName').innerText = 'Assinatura - ' + planName;
    document.getElementById('suitpayPlanPrice').innerText = 'R$ ' + priceStr;
    
    // Converte R$ 19,99 para 19.99 (número)
    const numericPrice = parseFloat(priceStr.replace('.', '').replace(',', '.'));
    currentPlanPrice = numericPrice;
    
    syncModalImages();
    
    // Reset forms
    document.getElementById('suitpayForm').style.display = 'block';
    document.getElementById('suitpayPixArea').style.display = 'none';
    document.getElementById('suitpayForm').reset();
    
    document.getElementById('suitpayModal').style.display = 'flex';
}

function closeSuitPayModal() {
    document.getElementById('suitpayModal').style.display = 'none';
}

function maskCpf(input) {
    let v = input.value.replace(/\D/g,"");
    v = v.replace(/(\d{3})(\d)/,"$1.$2");
    v = v.replace(/(\d{3})(\d)/,"$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/,"$1-$2");
    input.value = v;
}

// Generate random order number
function generateRequestNumber() {
    return 'PRV_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

// Format Date for DueDate (+1 day)
function getDueDateString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

async function handleSuitPaySubmit(event) {
    event.preventDefault();

    if (window.location.protocol === 'file:') {
        alert('ERRO: Você abriu o arquivo direto da pasta (protocolo file://). Para o checkout funcionar, o projeto precisa ser visualizado através de um servidor (como o da Netlify) ou rodado localmente com ferramentas como "Live Server".');
        return;
    }
    
    const name = document.getElementById('spName').value;
    const email = document.getElementById('spEmail').value;
    const cpfInput = document.getElementById('spCpf');
    const cpf = cpfInput ? cpfInput.value.replace(/\D/g, "") : "12345678909"; 

    const btn = document.getElementById('spSubmitBtn');
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando PIX...';
    btn.disabled = true;

    try {
        const payload = {
            amount: currentPlanPrice,
            client: {
                name: name,
                document: cpf,
                email: email
            }
        };

        // Chama o backend Node.js em /pagamento
        let response;
        try {
            response = await fetch('/pagamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            alert('Erro de conexão com o servidor. Verifique se o backend (Node.js) está rodando.');
            throw e;
        }

        let data;
        try {
            data = await response.json();
        } catch (parseEr) {
            alert('Erro: A resposta do pagamento foi inválida. O servidor pode estar fora do ar ou o gateway falhou.');
            throw parseEr;
        }

        console.log('Dados recebidos do Servidor:', data);

        if (response.ok && data.qr_code) {
            document.getElementById('suitpayForm').style.display = 'none';
            document.getElementById('suitpayPixArea').style.display = 'block';
            
            document.getElementById('spQrCode').src = data.qr_code;
            document.getElementById('spCopyPaste').value = data.pay_in_code || '';
        } else {
            const errorMsg = data.message || (data.details ? JSON.stringify(data.details) : 'Erro no processamento PIX');
            alert('Erro na resposta do pagamento: ' + errorMsg);
        }
    } catch(err) {
        console.error('Erro na requisição direta:', err);
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
    }
}

function copyPixCode() {
    const copyText = document.getElementById('spCopyPaste');
    if(!copyText || !copyText.value) return alert('Nenhum código para copiar.');
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value).then(() => {
        alert('Código PIX copiado com sucesso!');
    }).catch(err => {
        alert('Falha ao copiar.');
    });
}
