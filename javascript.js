(function () {
    'use strict';

    // ============================================================
    // VARIÁVEIS GLOBAIS
    // ============================================================
    let usuarios = [];
    let cidades = [];
    let usuarioLogado = null;
    let cidadeAtual = 'buique';
    let dadosPlanilha = [];
    let recibos = [];
    let logs = [];
    let auditoria = [];
    let editandoId = null;
    let currentSort = { column: null, direction: 'asc' };
    let theme = localStorage.getItem('dk_theme') || 'light';
    let modoParcial = false;

    // ============================================================
    // USUÁRIOS E CIDADES PADRÃO
    // ============================================================
    const USUARIOS_PADRAO = [
        {
            id: 'admin_global', login: 'admin', senha: '1603101989Ra-', nome: 'Administrador Global', cidade: 'all',
            nivel: 'admin', status: 'ativo'
        },
        {
            id: 'dk_testes', login: 'dktestes', senha: '1603101989rA-', nome: 'Dk Testes', cidade: 'manari',
            nivel: 'usuario', status: 'ativo'
        }
    ];

    const CIDADES_PADRAO = [
        { id: 'inaja', nome: 'Inajá', estado: 'PE', responsavel: '', ativo: true },
        { id: 'tupanatinga', nome: 'Tupanatinga', estado: 'PE', responsavel: '', ativo: true },
        { id: 'buique', nome: 'Buíque', estado: 'PE', responsavel: '', ativo: true },
        { id: 'itaiba', nome: 'Itaíba', estado: 'PE', responsavel: '', ativo: true },
        { id: 'manari', nome: 'Manarí', estado: 'PE', responsavel: '', ativo: true },
        { id: 'jirau', nome: 'Jirau', estado: 'PE', responsavel: '', ativo: true },
        { id: 'arcoverde', nome: 'Arcoverde', estado: 'PE', responsavel: '', ativo: true },
        { id: 'negras', nome: 'Negras', estado: 'PE', responsavel: '', ativo: true }
    ];

    // ============================================================
    // FUNÇÕES DE CARREGAMENTO/SALVAMENTO
    // ============================================================
    function carregarUsuarios() {
        try {
            const saved = localStorage.getItem('dk_usuarios');
            if (saved) {
                usuarios = JSON.parse(saved);
                for (let u of USUARIOS_PADRAO) {
                    if (!usuarios.find(usr => usr.id === u.id)) {
                        usuarios.push({ ...u });
                    }
                }
            } else {
                usuarios = USUARIOS_PADRAO.map(u => ({ ...u }));
            }
            salvarUsuarios();
        } catch (e) {
            usuarios = USUARIOS_PADRAO.map(u => ({ ...u }));
        }
    }

    function salvarUsuarios() {
        try { localStorage.setItem('dk_usuarios', JSON.stringify(usuarios)); } catch (e) { }
    }

    function carregarCidades() {
        try {
            const saved = localStorage.getItem('dk_cidades');
            if (saved) {
                cidades = JSON.parse(saved);
                for (let c of CIDADES_PADRAO) {
                    if (!cidades.find(cid => cid.id === c.id)) {
                        cidades.push({ ...c });
                    }
                }
            } else {
                cidades = CIDADES_PADRAO.map(c => ({ ...c }));
            }
            salvarCidades();
        } catch (e) {
            cidades = CIDADES_PADRAO.map(c => ({ ...c }));
        }
    }

    function salvarCidades() {
        try { localStorage.setItem('dk_cidades', JSON.stringify(cidades)); } catch (e) { }
    }

    function carregarLogs() {
        try {
            const saved = localStorage.getItem('dk_logs');
            if (saved) logs = JSON.parse(saved);
        } catch (e) { logs = []; }
    }

    function salvarLogs() {
        try { localStorage.setItem('dk_logs', JSON.stringify(logs)); } catch (e) { }
    }

    function carregarAuditoria() {
        try {
            const saved = localStorage.getItem('dk_auditoria');
            if (saved) auditoria = JSON.parse(saved);
        } catch (e) { auditoria = []; }
    }

    function salvarAuditoria() {
        try {
            if (auditoria.length > 1000) auditoria = auditoria.slice(0, 1000);
            localStorage.setItem('dk_auditoria', JSON.stringify(auditoria));
        } catch (e) { }
    }

    function getChaveCidade(cidadeId, chave) {
        return `dk_${cidadeId}_${chave}`;
    }

    function carregarDadosCidade(cidadeId) {
        try {
            const chavePlanilha = getChaveCidade(cidadeId, 'dados_planilha');
            const chaveRecibos = getChaveCidade(cidadeId, 'recibos');
            const dadosSalvos = localStorage.getItem(chavePlanilha);
            dadosPlanilha = dadosSalvos ? JSON.parse(dadosSalvos) : [];
            const recibosSalvos = localStorage.getItem(chaveRecibos);
            recibos = recibosSalvos ? JSON.parse(recibosSalvos) : [];
            for (let r of recibos) {
                if (r.valorNumerico === undefined) r.valorNumerico = extrairNumeroDoValor(r.valor);
            }
            cidadeAtual = cidadeId;
        } catch (e) {
            dadosPlanilha = [];
            recibos = [];
        }
    }

    function salvarDadosCidade() {
        try {
            const chavePlanilha = getChaveCidade(cidadeAtual, 'dados_planilha');
            const chaveRecibos = getChaveCidade(cidadeAtual, 'recibos');
            localStorage.setItem(chavePlanilha, JSON.stringify(dadosPlanilha));
            localStorage.setItem(chaveRecibos, JSON.stringify(recibos));
            fazerBackupAutomatico();
        } catch (e) { }
    }

    // ============================================================
    // FUNÇÕES AUXILIARES
    // ============================================================
    function formatarDataParaExibir(dataStr) {
        if (!dataStr) return '';
        let partes = dataStr.split('-');
        if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
        return dataStr;
    }

    function formatarMoeda(valor) {
        if (valor === undefined || valor === null || isNaN(valor) || valor == 0) return 'R$ 0,00';
        return 'R$ ' + parseFloat(valor).toFixed(2).replace('.', ',');
    }

    function capitalizar(texto) {
        if (!texto) return '';
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    }

    function extrairNumeroDoValor(valorStr) {
        if (!valorStr) return 0;
        let limpo = valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        let numero = parseFloat(limpo);
        return isNaN(numero) ? 0 : numero;
    }

    function calcularSomaRecibos() {
        let total = 0;
        for (let rec of recibos) {
            let val = rec.valorNumerico !== undefined ? rec.valorNumerico : extrairNumeroDoValor(rec.valor);
            total += val;
        }
        return total;
    }

    function formatarInputMoeda(input) {
        let v = input.value.replace(/\D/g, '');
        if (v === '') { input.value = ''; return; }
        input.value = 'R$ ' + (parseInt(v) / 100).toFixed(2).replace('.', ',');
    }

    function gerarIdUnico() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function getDataHoraAtual() {
        return new Date().toLocaleString('pt-BR');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function (m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function getCidadeNome(id) {
        const cidade = cidades.find(c => c.id === id);
        return cidade ? cidade.nome : id;
    }

    function getCidadeById(id) {
        return cidades.find(c => c.id === id);
    }

    function getUserById(id) {
        return usuarios.find(u => u.id === id);
    }

    function getUsuarioNome(id) {
        const user = getUserById(id);
        return user ? user.nome || user.login : 'Sistema';
    }

    // ============================================================
    // LOGS E AUDITORIA
    // ============================================================
    function adicionarLog(acao, detalhes) {
        const cidade = getCidadeById(cidadeAtual);
        const log = {
            data: new Date().toISOString(),
            dataFormatada: getDataHoraAtual(),
            usuario: usuarioLogado ? usuarioLogado.login : 'Sistema',
            usuarioNome: usuarioLogado ? usuarioLogado.nome : 'Sistema',
            cidade: cidade ? cidade.nome : 'Desconhecida',
            acao: acao,
            detalhes: detalhes || ''
        };
        logs.unshift(log);
        if (logs.length > 500) logs = logs.slice(0, 500);
        salvarLogs();
    }

    function adicionarAuditoria(tipo, cliente, valor, acao, usuarioId) {
        const cidade = getCidadeById(cidadeAtual);
        const auditoriaItem = {
            id: gerarIdUnico(),
            data: new Date().toISOString(),
            dataFormatada: getDataHoraAtual(),
            cidade: cidade ? cidade.nome : 'Desconhecida',
            cidadeId: cidade ? cidade.id : cidadeAtual,
            usuarioId: usuarioId || (usuarioLogado ? usuarioLogado.id : null),
            usuarioNome: usuarioId ? getUsuarioNome(usuarioId) : (usuarioLogado ? usuarioLogado.nome : 'Sistema'),
            tipo: tipo,
            cliente: cliente || '',
            valor: valor || 0,
            acao: acao || 'Criou'
        };
        auditoria.unshift(auditoriaItem);
        if (auditoria.length > 1000) auditoria = auditoria.slice(0, 1000);
        salvarAuditoria();
    }

    // ============================================================
    // BACKUP AUTOMÁTICO
    // ============================================================
    function fazerBackupAutomatico() {
        try {
            const cidade = getCidadeById(cidadeAtual);
            if (!cidade) return;
            const dados = {
                cidadeId: cidade.id,
                cidadeNome: cidade.nome,
                planilha: dadosPlanilha,
                recibos: recibos,
                dataBackup: new Date().toISOString(),
                versao: '1.0'
            };
            const chave = getChaveCidade(cidade.id, 'backup_automatico');
            localStorage.setItem(chave, JSON.stringify(dados));
        } catch (e) { }
    }

    function restaurarBackupAutomatico() {
        try {
            const cidade = getCidadeById(cidadeAtual);
            if (!cidade) return false;
            const chave = getChaveCidade(cidade.id, 'backup_automatico');
            const dadosSalvos = localStorage.getItem(chave);
            if (!dadosSalvos) return false;
            const dados = JSON.parse(dadosSalvos);
            if (!dados.planilha || !dados.recibos) return false;
            if (dados.planilha.length === 0 && dados.recibos.length === 0) return false;
            if (dadosPlanilha.length === 0 && recibos.length === 0) {
                dadosPlanilha = dados.planilha;
                recibos = dados.recibos;
                for (let r of recibos) {
                    if (r.valorNumerico === undefined) r.valorNumerico = extrairNumeroDoValor(r.valor);
                }
                salvarDadosCidade();
                return true;
            }
            return false;
        } catch (e) { return false; }
    }

    // ============================================================
    // AUTENTICAÇÃO
    // ============================================================
    function fazerLogin(login, senha, cidadeId) {
        const usuario = usuarios.find(u =>
            u.login.toLowerCase() === login.toLowerCase() &&
            u.senha === senha &&
            u.status === 'ativo'
        );

        if (!usuario) {
            document.getElementById('loginError').classList.add('show');
            document.getElementById('loginError').textContent = '❌ Usuário ou senha inválidos!';
            adicionarLog('❌ Tentativa de login', `Usuário: ${login} - Falha`);
            return false;
        }

        if (usuario.cidade === 'all' && usuario.nivel === 'admin') {
            usuarioLogado = usuario;
            cidadeAtual = cidadeId;
            localStorage.setItem('dk_sessao', JSON.stringify({
                usuarioId: usuario.id,
                cidade: cidadeId,
                data: new Date().toISOString()
            }));
            adicionarLog('✅ Login realizado (Admin Global)', `${usuario.nome} - ${getCidadeNome(cidadeId)}`);
            document.getElementById('loginError').classList.remove('show');
            return true;
        }

        if (usuario.cidade !== cidadeId) {
            document.getElementById('loginError').classList.add('show');
            document.getElementById('loginError').textContent = '❌ Você não tem acesso a esta cidade!';
            adicionarLog('❌ Tentativa de login', `Usuário: ${login} - Acesso negado à cidade ${cidadeId}`);
            return false;
        }

        usuarioLogado = usuario;
        cidadeAtual = cidadeId;

        localStorage.setItem('dk_sessao', JSON.stringify({
            usuarioId: usuario.id,
            cidade: cidadeId,
            data: new Date().toISOString()
        }));

        adicionarLog('✅ Login realizado', `${usuario.nome} - ${getCidadeNome(cidadeId)}`);
        document.getElementById('loginError').classList.remove('show');
        return true;
    }

    function verificarSessao() {
        try {
            const sessao = localStorage.getItem('dk_sessao');
            if (!sessao) return false;
            const dados = JSON.parse(sessao);
            const usuario = getUserById(dados.usuarioId);
            if (!usuario || usuario.status !== 'ativo') return false;
            usuarioLogado = usuario;
            cidadeAtual = dados.cidade;
            return true;
        } catch (e) { return false; }
    }

    function logout() {
        adicionarLog('🚪 Logout', usuarioLogado ? usuarioLogado.nome : 'Sistema');
        usuarioLogado = null;
        localStorage.removeItem('dk_sessao');
        document.getElementById('appLayout').style.display = 'none';
        document.getElementById('loginContainer').classList.remove('hidden');
        document.getElementById('loginError').classList.remove('show');
        document.getElementById('loginError').textContent = '❌ Usuário ou senha inválidos!';
        document.getElementById('loginUsuario').value = '';
        document.getElementById('loginSenha').value = '';
    }

    // ============================================================
    // FUNÇÃO SALVAR RECIBOS FORMATADOS
    // ============================================================
    function salvarRecibosFormatados() {
        if (recibos.length === 0) {
            alert('❌ Nenhum recibo para salvar!');
            return;
        }

        let recibosHTML = '';
        let totalGeral = calcularSomaRecibos();

        for (let r of recibos) {
            recibosHTML += gerarHTMLReciboIdentico(r);
        }

        let somaHTML = `
                <div style="text-align:center; margin:12px 0; font-weight:bold; font-size:16px; border-top:2px solid #333; padding-top:12px; width:100%; clear:both;">
                    💰 TOTAL GERAL: ${formatarMoeda(totalGeral)}
                </div>`;

        let htmlCompleto = `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>DK Telecom - Todos os Recibos</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
                        body { background: white; padding: 15mm 20mm; }
                        .print-receipt-area { width: 100%; max-width: 800px; margin: 0 auto; }
                        .recibo-form-card-print { 
                            border: 2px solid #000; 
                            border-radius: 8px; 
                            padding: 14px 18px; 
                            margin: 0 0 8px 0; 
                            width: 100%; 
                            box-sizing: border-box; 
                            font-size: 11px; 
                            break-inside: avoid; 
                            page-break-inside: avoid; 
                            display: flex; 
                            flex-direction: column; 
                            justify-content: center;
                            background: #ffffff;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        }
                        .recibo-form-card-print:hover {
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }
                        .logo-recibo-print { 
                            text-align: center; 
                            margin-bottom: 8px; 
                            padding-bottom: 6px; 
                            border-bottom: 2px solid #ddd; 
                        }
                        .logo-recibo-print img { 
                            max-width: 80px; 
                            height: auto; 
                            display: block; 
                            margin: 0 auto; 
                        }
                        .recibo-linhas-print { display: flex; flex-direction: column; gap: 4px; }
                        .linha-recibo-print { 
                            display: flex; 
                            align-items: baseline; 
                            flex-wrap: wrap; 
                            padding-bottom: 2px; 
                        }
                        .linha-recibo-print label { 
                            width: 80px; 
                            font-size: 10px; 
                            font-weight: 700; 
                            color: #333; 
                            flex-shrink: 0; 
                        }
                        .linha-recibo-print .valor-print { 
                            flex: 1; 
                            border-bottom: 1px solid #000; 
                            padding: 2px 6px; 
                            font-size: 11px; 
                            min-width: 40px; 
                        }
                        .linha-dupla-print { display: flex; gap: 12px; flex-wrap: wrap; }
                        .linha-dupla-print .linha-recibo-print { flex: 1; min-width: 60px; }
                        .total-soma-print { 
                            text-align: center; 
                            margin: 12px 0; 
                            font-weight: bold; 
                            font-size: 16px; 
                            border-top: 3px solid #333; 
                            padding-top: 12px; 
                            width: 100%; 
                            clear: both; 
                            color: #1a3a5c;
                        }
                        .recibo-form-card-print:nth-child(4n) { page-break-after: always; }
                        .footer-print {
                            text-align: center;
                            margin-top: 16px;
                            font-size: 10px;
                            color: #888;
                            border-top: 1px solid #ddd;
                            padding-top: 8px;
                        }
                        .data-print {
                            text-align: right;
                            font-size: 10px;
                            color: #666;
                            margin-bottom: 8px;
                        }
                        @media print {
                            body { padding: 5mm 8mm; }
                            .recibo-form-card-print { border: 1px solid #000; padding: 8px 12px; margin: 0 0 4px 0; font-size: 9px; }
                            .recibo-form-card-print .linha-recibo-print label { width: 60px; font-size: 8px; }
                            .recibo-form-card-print .linha-recibo-print .valor-print { font-size: 9px; padding: 1px 4px; }
                            .recibo-form-card-print .logo-recibo-print img { max-width: 50px; }
                        }
                        @page { size: A4; margin: 10mm 15mm; }
                    </style>
                </head>
                <body>
                    <div class="print-receipt-area">
                        <div class="data-print">
                            📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
                        </div>
                        ${recibosHTML}
                        ${somaHTML}
                        <div class="footer-print">
                            DK Telecom - ${getCidadeNome(cidadeAtual)} • Total de recibos: ${recibos.length}
                        </div>
                    </div>
                </body>
                </html>`;

        const blob = new Blob([htmlCompleto], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const dataStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        link.href = url;
        link.download = `RECIBOS_FORMATADOS_${getCidadeNome(cidadeAtual)}_${dataStr}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        adicionarLog('💾 Salvou recibos formatados', `${recibos.length} recibos`);
        alert(`✅ ${recibos.length} recibos formatados salvos com sucesso!`);
    }

    // ============================================================
    // FUNÇÃO GERAR HTML RECIBO
    // ============================================================
    function gerarHTMLTabela(cidade) {
        let totalMensalidades = 0, totalInstalacoes = 0, totalDespesas = 0;
        let totalDinheiro = 0, totalPix = 0, totalEntradas = 0;
        let totalSangrias = 0;

        for (let item of dadosPlanilha) {
            const entrada = (item.mensalidade || 0) + (item.instalacao || 0);
            const saida = (item.valorDespesa || 0) + (item.sangria || 0);
            totalMensalidades += (item.mensalidade || 0);
            totalInstalacoes += (item.instalacao || 0);
            totalDespesas += (item.valorDespesa || 0);
            totalSangrias += (item.sangria || 0);
            totalEntradas += entrada;

            if (item.pagamentoParcial) {
                totalDinheiro += (item.valorDinheiro || 0);
                totalPix += (item.valorPix || 0) + (item.valorCartao || 0);
            } else {
                if (item.metodoPagamento === 'PIX' || item.metodoPagamento === 'Cartão') {
                    totalPix += entrada;
                } else {
                    totalDinheiro += entrada;
                }
            }
        }

        const cidadeNome = cidade ? cidade.nome : 'DK TELECOM';
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const resultado = totalEntradas - totalDespesas - totalSangrias;
        const resultadoCor = resultado >= 0 ? '#15803d' : '#b91c1c';
        const resultadoSinal = resultado >= 0 ? '+' : '';

        // Funções auxiliares dentro da função
        function formatarMoedaPDF(valor) {
            if (valor === undefined || valor === null || isNaN(valor) || valor == 0) return 'R$ 0,00';
            return 'R$ ' + parseFloat(valor).toFixed(2).replace('.', ',');
        }

        function formatarDataPDF(dataStr) {
            if (!dataStr) return '';
            let partes = dataStr.split('-');
            if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
            return dataStr;
        }

        let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Planilha de Caixa - ${cidadeNome}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: #f0f4f8;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            color: #0f172a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.06);
            overflow: hidden;
        }

        /* ===== HEADER ===== */
        .header {
            background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 24px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .header-left h1 {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.4px;
            margin-bottom: 2px;
        }

        .header-left h1 span {
            color: #60a5fa;
        }

        .header-left .subtitle {
            font-size: 13px;
            opacity: 0.7;
            font-weight: 400;
            letter-spacing: 0.3px;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .header-right .data {
            font-size: 15px;
            font-weight: 600;
            color: #e2e8f0;
            white-space: nowrap;
        }

        .header-right .fluxo {
            display: inline-block;
            background: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.2);
            color: #86efac;
            font-size: 12px;
            font-weight: 600;
            padding: 5px 16px;
            border-radius: 24px;
            letter-spacing: 0.3px;
            white-space: nowrap;
        }

        /* ===== TABELA ===== */
        .table-wrapper {
            padding: 0;
            margin: 0;
            overflow-x: auto;
            width: 100%;
        }

        .caixa {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            background: white;
            font-size: 12px;
            margin: 0;
            padding: 0;
            border: 1px solid #000;
        }

        /* ===== CABEÇALHO ===== */
        .cabecalho th {
            background: #D9D9D9;
            color: #1a1a2e;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 6px;
            border: 1px solid #000;
            text-align: center;
        }

        .cabecalho th:nth-child(2) { 
            text-align: left; 
        }

        /* ===== LINHAS DE DADOS ===== */
        .linha-dados td {
            padding: 7px 5px;
            border: 1px solid #000;
            text-align: center;
            vertical-align: middle;
            color: #1a1a2e;
            font-size: 10px;
            background: #DCE6F1;
        }

        .linha-dados td:nth-child(2) {
            text-align: left;
            font-weight: 600;
            font-size: 12px;
        }

        /* Cores das colunas de dados (igual ao Excel) */
        .linha-dados td:nth-child(1) { background: #DCE6F1; }  /* Vencimento */
        .linha-dados td:nth-child(2) { background: #DCE6F1; }  /* Cliente */
        .linha-dados td:nth-child(3) { background: #D9EAD3; }  /* Mensalidade */
        .linha-dados td:nth-child(4) { background: #DCE6F1; }  /* Instalação */
        .linha-dados td:nth-child(5) { background: #D9EAD3; }  /* Valor Inst. */
        .linha-dados td:nth-child(6) { background: #F4B6C1; }  /* Despesas */
        .linha-dados td:nth-child(7) { background: #F4B6C1; }  /* Valor Desp. */
        .linha-dados td:nth-child(8) { background: #DCE6F1; }  /* Dinheiro */
        .linha-dados td:nth-child(9) { background: #DCE6F1; }  /* PIX/Cartão */

        .linha-dados:hover td {
            opacity: 0.85;
        }

        /* Cores dos valores */
        .col-valor-entrada {
            color: #1a7a3a;
            font-weight: 600;
        }
        .col-valor-despesa {
            color: #bc4e2c;
            font-weight: 600;
        }
        .col-check {
            font-weight: 700;
            font-size: 14px;
        }

        /* ===== TOTAL ===== */
        .total-row td {
            background: #1A2A1A !important;
            color: #ffffff !important;
            font-weight: 700;
            padding: 8px 6px !important;
            border: 1px solid #000;
            font-size: 11px;
        }

        .total-row td:first-child {
            text-align: right;
            padding-right: 14px !important;
        }

        .total-row td:nth-child(3),
        .total-row td:nth-child(5),
        .total-row td:nth-child(7) {
            color: #a7f3d0 !important;
        }

        /* ===== CARDS DE RESUMO ===== */
        .resumo-cards {
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
            padding: 20px 16px 24px;
            background: #f5f5f5;
            border-top: 2px solid #000;
        }

        .card {
            width: 155px;
            font-family: Georgia, "Times New Roman", serif;
            border: 2px solid #000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            border-radius: 4px;
            overflow: hidden;
        }

        .card h3 {
            background: #EFEFEF;
            padding: 8px;
            text-align: center;
            font-size: 10px;
            border-bottom: 2px solid #000;
            font-weight: 700;
            color: #1a1a2e;
        }

        .card p {
            padding: 12px;
            text-align: center;
            color: white;
            font-weight: 700;
            font-size: 16px;
        }

        .card-entrada p { background: #2F7D31; }
        .card-dinheiro p { background: #FFC000; color: #1a1a2e; }
        .card-pix p { background: #7EA6F0; }
        .card-despesas p { background: #CF2020; }
        .card-resultado p { background: ${resultadoCor}; }

        /* ===== FOOTER ===== */
        .footer-pdf {
            text-align: center;
            font-size: 10px;
            color: #6e7681;
            padding: 12px;
            border-top: 1px solid #dce0e6;
            background: #fff;
        }

        /* ===== IMPRESSÃO ===== */
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            .header {
                padding: 14px 20px;
                background: #0f172a !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .header-left h1 { font-size: 18px; }
            .header-left .subtitle { font-size: 11px; }
            .header-right .data { font-size: 13px; }
            .header-right .fluxo { font-size: 11px; padding: 4px 14px; }
            .table-wrapper { padding: 0; }

            .cabecalho th {
                padding: 5px 4px;
                font-size: 7px;
                background: #D9D9D9 !important;
                border: 1px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .linha-dados td {
                padding: 4px 4px;
                font-size: 8px;
                border: 1px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .linha-dados td:nth-child(1) { background: #DCE6F1 !important; }
            .linha-dados td:nth-child(2) { background: #DCE6F1 !important; }
            .linha-dados td:nth-child(3) { background: #D9EAD3 !important; }
            .linha-dados td:nth-child(4) { background: #DCE6F1 !important; }
            .linha-dados td:nth-child(5) { background: #D9EAD3 !important; }
            .linha-dados td:nth-child(6) { background: #F4B6C1 !important; }
            .linha-dados td:nth-child(7) { background: #F4B6C1 !important; }
            .linha-dados td:nth-child(8) { background: #DCE6F1 !important; }
            .linha-dados td:nth-child(9) { background: #DCE6F1 !important; }

            .total-row td {
                padding: 4px 4px !important;
                font-size: 9px;
                background: #1A2A1A !important;
                border: 1px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .resumo-cards {
                padding: 12px 10px 16px;
                gap: 8px;
                background: #f5f5f5 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .card {
                width: 120px;
                border: 2px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .card h3 { font-size: 8px; padding: 6px; }
            .card p { font-size: 13px; padding: 8px; }
            .card-dinheiro p { background: #FFC000 !important; }
            .card-pix p { background: #7EA6F0 !important; }
            .card-despesas p { background: #CF2020 !important; }
            .card-entrada p { background: #2F7D31 !important; }
            .card-resultado p { background: ${resultadoCor} !important; }
            .footer-pdf { font-size: 8px; padding: 8px; }
        }

        @page {
            size: A4 landscape;
            margin: 5mm 8mm;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <div class="header-left">
                <h1>📊 Planilha de <span>Caixa</span> Diário</h1>
                <div class="subtitle">DK TELECOM · ${cidadeNome}</div>
            </div>
            <div class="header-right">
                <div class="data">📅 ${dataAtual}</div>
                <div class="fluxo">💰 Fluxo de Caixa</div>
            </div>
        </div>

        <!-- TABELA -->
        <div class="table-wrapper">
            <table class="caixa">
                <colgroup>
                    <col style="width:10%;">
                    <col style="width:26%;">
                    <col style="width:10%;">
                    <col style="width:20%;">
                    <col style="width:10%;">
                    <col style="width:12%;">
                    <col style="width:9%;">
                    <col style="width:4%;">
                    <col style="width:4%;">
                </colgroup>
                <thead>
                    <tr class="cabecalho">
                        <th>Vencimento</th>
                        <th>Cliente</th>
                        <th>Mensalidade</th>
                        <th>Instalação / Instalador</th>
                        <th>Valor Inst.</th>
                        <th>Despesas</th>
                        <th>Valor Desp.</th>
                        <th>Dinheiro</th>
                        <th>PIX/Cartão</th>
                    </tr>
                </thead>
                <tbody>`;

        // ===== LINHAS DE DADOS =====
        for (let item of dadosPlanilha) {
            let isDinheiro = false;
            let isPixCartao = false;

            if (item.pagamentoParcial) {
                isDinheiro = (item.valorDinheiro || 0) > 0;
                isPixCartao = (item.valorPix || 0) > 0 || (item.valorCartao || 0) > 0;
            } else {
                isDinheiro = (item.metodoPagamento === 'Dinheiro');
                isPixCartao = (item.metodoPagamento === 'PIX' || item.metodoPagamento === 'Cartão');
            }

            let instaladorInfo = '';
            if (item.instalador && item.instalacao > 0) {
                instaladorInfo = `${item.instalador}`;
            } else if (item.instalador) {
                instaladorInfo = item.instalador;
            }

            html += `
                    <tr class="linha-dados">
                        <td>${formatarDataPDF(item.vencimento) || ''}</td>
                        <td>${item.cliente || ''}</td>
                        <td class="col-valor-entrada">${(item.mensalidade || 0) > 0 ? formatarMoedaPDF(item.mensalidade) : ''}</td>
                        <td>${instaladorInfo}</td>
                        <td class="col-valor-entrada">${(item.instalacao || 0) > 0 ? formatarMoedaPDF(item.instalacao) : ''}</td>
                        <td>${item.despesas || ''}</td>
                        <td class="col-valor-despesa">${(item.valorDespesa || 0) > 0 ? formatarMoedaPDF(item.valorDespesa) : ''}</td>
                        <td class="col-check">${isDinheiro ? 'X' : ''}</td>
                        <td class="col-check">${isPixCartao ? 'X' : ''}</td>
                    </tr>`;
        }

        // ===== LINHAS VAZIAS =====
        const linhasExtras = Math.max(0, 18 - dadosPlanilha.length);
        for (let i = 0; i < linhasExtras; i++) {
            html += `
                    <tr class="linha-dados">
                        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                    </tr>`;
        }

        // ===== RODAPÉ =====
        const totalSaida = totalDespesas + totalSangrias;

        html += `
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="2" style="text-align:right; padding-right:14px;">TOTAIS</td>
                        <td>${formatarMoedaPDF(totalMensalidades)}</td>
                        <td></td>
                        <td>${formatarMoedaPDF(totalInstalacoes)}</td>
                        <td></td>
                        <td>${formatarMoedaPDF(totalDespesas)}</td>
                        <td></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- CARDS DE RESUMO -->
        <div class="resumo-cards">
            <div class="card card-entrada">
                <h3>TOTAL DE ENTRADAS</h3>
                <p>${formatarMoedaPDF(totalEntradas)}</p>
            </div>
            <div class="card card-dinheiro">
                <h3>SALDO EM DINHEIRO</h3>
                <p>${formatarMoedaPDF(totalDinheiro)}</p>
            </div>
            <div class="card card-pix">
                <h3>PIX/CARTÃO</h3>
                <p>${formatarMoedaPDF(totalPix)}</p>
            </div>
            <div class="card card-despesas">
                <h3>DESPESAS</h3>
                <p>${formatarMoedaPDF(totalDespesas)}</p>
            </div>
            <div class="card card-resultado">
                <h3>📊 RESULTADO</h3>
                <p>${resultadoSinal}${formatarMoedaPDF(Math.abs(resultado))}</p>
            </div>
        </div>

        <div class="footer-pdf">
            Gerado em ${new Date().toLocaleString('pt-BR')} · ${cidadeNome}
        </div>
    </div>
</body>
</html>`;

        return html;
    }

    // ============================================================
    // FUNÇÕES DE EXCLUSÃO (GLOBAIS)
    // ============================================================
    window.excluirReciboPorId = function (id) {
        const recibo = recibos.find(r => r.id === id);
        if (!recibo) { alert('❌ Recibo não encontrado!'); return; }
        if (confirm(`⚠️ Tem certeza que deseja excluir o recibo de "${recibo.nome || 'Cliente'}" no valor de ${recibo.valor}?`)) {
            const nome = recibo.nome || 'Cliente';
            const valor = recibo.valor;
            recibos = recibos.filter(r => r.id !== id);
            dadosPlanilha = dadosPlanilha.filter(item => item.reciboId !== id);
            salvarDadosCidade();
            renderizarTabela();
            atualizarCardsResumo();
            adicionarLog('🗑️ Excluiu recibo', `${nome} - ${valor}`);
            adicionarAuditoria('Recibo', nome, extrairNumeroDoValor(valor), 'Excluiu');
            alert('✅ Recibo excluído com sucesso!');
        }
    };

    window.excluirItemPlanilha = function (index) {
        if (index < 0 || index >= dadosPlanilha.length) { alert('❌ Item não encontrado!'); return; }
        const item = dadosPlanilha[index];
        const nomeCliente = item.cliente || 'Item';
        const valor = item.mensalidade || 0;
        if (confirm(`⚠️ Tem certeza que deseja excluir o registro de "${nomeCliente}" no valor de ${formatarMoeda(valor)}?`)) {
            if (item.reciboId) {
                recibos = recibos.filter(r => r.id !== item.reciboId);
            }
            dadosPlanilha.splice(index, 1);
            salvarDadosCidade();
            renderizarTabela();
            atualizarCardsResumo();
            adicionarLog('🗑️ Excluiu item da planilha', `${nomeCliente} - ${formatarMoeda(valor)}`);
            adicionarAuditoria('Planilha', nomeCliente, valor, 'Excluiu');
            alert('✅ Registro excluído com sucesso!');
        }
    };

    // ============================================================
    // FUNÇÃO RENDERIZAR TABELA
    // ============================================================
    function renderizarTabela() {
        let tbody = document.getElementById('tbody');
        let fundoEl = document.getElementById('fundoCaixa');
        fundoEl.textContent = 'R$ 100,00';

        if (dadosPlanilha.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum registro adicionado</td></tr>';
            return;
        }

        let dadosOrdenados = [...dadosPlanilha];
        if (currentSort.column) {
            dadosOrdenados.sort((a, b) => {
                let valA = a[currentSort.column] || 0;
                let valB = b[currentSort.column] || 0;
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        let html = '';
        let index = 0;
        for (let item of dadosOrdenados) {
            index++;
            let isRecibo = item.origem === 'recibo';
            let classeRecibo = isRecibo ? 'class="row-recibo"' : '';
            let clienteNome = item.cliente || '';

            let isDinheiro = false;
            let isPixCartao = false;

            if (item.pagamentoParcial) {
                isDinheiro = (item.valorDinheiro || 0) > 0;
                isPixCartao = (item.valorPix || 0) > 0 || (item.valorCartao || 0) > 0;
            } else {
                isDinheiro = (item.metodoPagamento === 'Dinheiro');
                isPixCartao = (item.metodoPagamento === 'PIX' || item.metodoPagamento === 'Cartão');
            }

            let dinheiroMark = isDinheiro ? 'X' : '';
            let pixMark = isPixCartao ? 'X' : '';

            let tags = '';
            if (isRecibo) tags += '<span class="tag-recibo">Recibo</span>';
            if (item.pagamentoParcial) tags += '<span class="tag-parcial">Parcial</span>';

            const realIndex = dadosPlanilha.indexOf(item);
            const usuarioNome = item.usuarioId ? getUsuarioNome(item.usuarioId) : (item.usuario || 'Sistema');

            html += `<tr ${classeRecibo}>
                    <td>${index}</td>
                    <td>${formatarDataParaExibir(item.vencimento) || '—'}</td>
                    <td style="font-weight:${clienteNome ? '700' : '400'};">
                        ${clienteNome}
                        ${tags}
                    </td>
                    <td class="valor-green">${formatarMoeda(item.mensalidade)}</td>
                    <td>${item.instalador || '—'}</td>
                    <td class="valor-green">${formatarMoeda(item.instalacao)}</td>
                    <td style="font-weight:700;">${item.despesas || '—'}</td>
                    <td class="valor-red">${formatarMoeda(item.valorDespesa)}</td>
                    <td style="font-weight:700; color:var(--success);">${dinheiroMark}</td>
                    <td style="font-weight:700; color:var(--primary-light);">${pixMark}</td>
                    <td style="font-size:9px; color:var(--text-muted);">${escapeHtml(usuarioNome)}</td>
                    <td>
                        <button class="btn-excluir-linha" onclick="excluirItemPlanilha(${realIndex})" title="Excluir este registro">
                            🗑️
                        </button>
                    </td>
                </tr>`;
        }
        tbody.innerHTML = html;
        atualizarCardsResumo();
    }

    // ============================================================
    // ATUALIZAR CARDS
    // ============================================================
    function atualizarCardsResumo() {
        let totalEntradas = 0;
        let totalDinheiro = 0;
        let totalPix = 0;
        let totalDespesas = 0;
        let totalSangrias = 0;

        for (let item of dadosPlanilha) {
            const entrada = (item.mensalidade || 0) + (item.instalacao || 0);
            totalEntradas += entrada;
            totalDespesas += (item.valorDespesa || 0);
            totalSangrias += (item.sangria || 0);

            if (item.pagamentoParcial) {
                totalDinheiro += (item.valorDinheiro || 0);
                totalPix += (item.valorPix || 0) + (item.valorCartao || 0);
            } else {
                if (item.metodoPagamento === 'PIX' || item.metodoPagamento === 'Cartão') {
                    totalPix += entrada;
                } else {
                    totalDinheiro += entrada;
                }
            }
        }

        const totalDespesasGeral = totalDespesas + totalSangrias;
        const resultado = totalEntradas - totalDespesasGeral;

        const cardResultado = document.getElementById('cardResultado');
        cardResultado.textContent = formatarMoeda(resultado);
        cardResultado.className = 'card-value resultado';
        if (resultado > 0) cardResultado.classList.add('positivo');
        else if (resultado < 0) cardResultado.classList.add('negativo');

        document.getElementById('cardSaldoDinheiro').textContent = formatarMoeda(totalDinheiro);
        document.getElementById('cardSaldoPix').textContent = formatarMoeda(totalPix);
        document.getElementById('cardDespesas').textContent = formatarMoeda(totalDespesasGeral);
    }

    // ============================================================
    // FUNÇÕES DE RECIBOS
    // ============================================================
    function atualizarSomaTotalUI() {
        let soma = calcularSomaRecibos();
        let somaEl = document.getElementById('somaTotalRecibos');
        if (somaEl) somaEl.innerHTML = `💰 Total Geral: <span>${formatarMoeda(soma)}</span>`;
        let badge = document.getElementById('badgeRecibos');
        if (badge) badge.textContent = recibos.length;
    }

    function carregarRecibos() {
        ordenarRecibos();
        atualizarListaRecibos();
        atualizarSomaTotalUI();
        atualizarInfoBackup();
    }

    function ordenarRecibos() {
        recibos.sort((a, b) => {
            const ordem = { 'Dinheiro': 1, 'PIX': 2, 'Cartão': 2 };
            return (ordem[a.metodoPagamento] || 2) - (ordem[b.metodoPagamento] || 2);
        });
    }

    function salvarRecibos() {
        try {
            ordenarRecibos();
            salvarDadosCidade();
            atualizarListaRecibos();
            atualizarSomaTotalUI();
            atualizarInfoBackup();
        } catch (e) {
            alert('❌ Erro ao salvar recibos.');
        }
    }

    function atualizarListaRecibos() {
        let container = document.getElementById('listaRecibos');
        if (!container) return;
        if (recibos.length === 0) {
            container.innerHTML =
                '<div style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum recibo salvo.<br>Clique em "NOVO RECIBO" para criar.</div>';
            return;
        }
        let html = '';
        for (let r of recibos) {
            let metodoTag = '';
            if (r.pagamentoParcial) {
                let partes = [];
                if (r.valorDinheiro > 0) partes.push(`💰 ${formatarMoeda(r.valorDinheiro)}`);
                if (r.valorPix > 0) partes.push(`📱 ${formatarMoeda(r.valorPix)}`);
                if (r.valorCartao > 0) partes.push(`💳 ${formatarMoeda(r.valorCartao)}`);
                metodoTag =
                    `<span style="font-size:9px; background:var(--bg-primary); padding:2px 8px; border-radius:20px; margin-left:6px; color:var(--text-muted); display:inline-block;">${partes.join(' | ')}</span>`;
            } else {
                metodoTag =
                    `<span style="font-size:10px; background:var(--bg-primary); padding:2px 8px; border-radius:20px; margin-left:6px; color:var(--text-muted);">${r.metodoPagamento || ''}</span>`;
            }

            html +=
                `<div class="card-recibo" data-id="${r.id}"><div class="card-recibo-info"><h4>${escapeHtml(r.nome || 'Cliente')} ${metodoTag}</h4><p>Login: ${escapeHtml(r.login || '—')} | ID: ${escapeHtml(r.idContrato || '—')}</p><p>Data: ${r.dataFormatada || r.data} | Mês: ${r.referenciaFormatada || r.referencia} | Valor: ${r.valor}</p></div><div class="card-recibo-actions"><button class="btn-card btn-editar-card" data-id="${r.id}">✏️ Editar</button><button class="btn-card btn-imprimir-card" data-id="${r.id}">🖨️ Imprimir</button><button class="btn-card btn-excluir-card" data-id="${r.id}" onclick="excluirReciboPorId('${r.id}')">🗑️ Excluir</button></div></div>`;
        }
        container.innerHTML = html;
        document.querySelectorAll('.btn-imprimir-card').forEach(btn => btn.addEventListener('click', (e) => {
            let id = btn.getAttribute('data-id');
            imprimirReciboPorId(id);
        }));
        document.querySelectorAll('.btn-editar-card').forEach(btn => btn.addEventListener('click', (e) => {
            let id = btn.getAttribute('data-id');
            abrirEdicao(id);
        }));
    }

    // ============================================================
    // GERAR HTML DO RECIBO (usado por impressão e salvar formatado)
    // ============================================================
    function gerarHTMLReciboIdentico(rec) {
        if (!rec) return '';

        let metodoStr = '';
        if (rec.pagamentoParcial) {
            const partes = [];
            if ((rec.valorDinheiro || 0) > 0) partes.push(`Dinheiro: ${formatarMoeda(rec.valorDinheiro)}`);
            if ((rec.valorPix || 0) > 0) partes.push(`PIX: ${formatarMoeda(rec.valorPix)}`);
            if ((rec.valorCartao || 0) > 0) partes.push(`Cartão: ${formatarMoeda(rec.valorCartao)}`);
            metodoStr = partes.join(' | ') || 'Pagamento Dividido';
        } else {
            metodoStr = rec.metodoPagamento || 'Dinheiro';
        }

        const nome = escapeHtml(rec.nome || '______________');
        const login = escapeHtml(rec.login || '—');
        const idContrato = escapeHtml(rec.idContrato || '—');
        const data = rec.dataFormatada || formatarDataParaExibir(rec.data) || '—';
        const referencia = rec.referenciaFormatada || formatarDataParaExibir(rec.referencia) || '—';
        const valor = rec.valor || 'R$ 0,00';
        const cidadeNome = getCidadeNome(cidadeAtual);

        return `
            <div class="recibo-form-card-print">
                <div class="logo-recibo-print">
                    <div style="font-size:18px;font-weight:700;color:#1e3a5f;letter-spacing:1px;">DK TELECOM</div>
                    <div style="font-size:11px;color:#666;margin-top:2px;">${escapeHtml(cidadeNome)}</div>
                </div>
                <div class="recibo-linhas-print">
                    <div class="linha-recibo-print">
                        <label>NOME:</label>
                        <span class="valor-print">${nome}</span>
                    </div>
                    <div class="linha-dupla-print">
                        <div class="linha-recibo-print">
                            <label>DATA:</label>
                            <span class="valor-print">${data}</span>
                        </div>
                        <div class="linha-recibo-print">
                            <label>MÊS REF:</label>
                            <span class="valor-print">${referencia}</span>
                        </div>
                    </div>
                    <div class="linha-recibo-print">
                        <label>VALOR:</label>
                        <span class="valor-print" style="font-weight:700;">${valor}</span>
                    </div>
                    <div class="linha-recibo-print">
                        <label>PAGAMENTO:</label>
                        <span class="valor-print">${escapeHtml(metodoStr)}</span>
                    </div>
                    <div class="linha-dupla-print">
                        <div class="linha-recibo-print">
                            <label>LOGIN:</label>
                            <span class="valor-print">${login}</span>
                        </div>
                        <div class="linha-recibo-print">
                            <label>ID:</label>
                            <span class="valor-print">${idContrato}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function imprimirTodosRecibos() {
        if (recibos.length === 0) {
            alert('❌ Nenhum recibo para imprimir!');
            return;
        }

        let recibosHTML = '';
        for (let r of recibos) {
            recibosHTML += gerarHTMLReciboIdentico(r);
        }

        const totalGeral = calcularSomaRecibos();
        const cidadeNome = getCidadeNome(cidadeAtual);
        const dataStr = new Date().toLocaleDateString('pt-BR');
        const horaStr = new Date().toLocaleTimeString('pt-BR');

        const htmlCompleto = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>DK Telecom - Todos os Recibos</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
        body { background: white; padding: 15mm 20mm; }
        .print-receipt-area { width: 100%; max-width: 800px; margin: 0 auto; }
        .recibo-form-card-print {
            border: 2px solid #000;
            border-radius: 8px;
            padding: 14px 18px;
            margin: 0 0 10px 0;
            width: 100%;
            box-sizing: border-box;
            font-size: 11px;
            break-inside: avoid;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #ffffff;
        }
        .logo-recibo-print {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 2px solid #ddd;
        }
        .recibo-linhas-print { display: flex; flex-direction: column; gap: 4px; }
        .linha-recibo-print {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            padding-bottom: 2px;
        }
        .linha-recibo-print label {
            width: 80px;
            font-size: 10px;
            font-weight: 700;
            color: #333;
            flex-shrink: 0;
        }
        .linha-recibo-print .valor-print {
            flex: 1;
            border-bottom: 1px solid #000;
            padding: 2px 6px;
            font-size: 11px;
            min-width: 40px;
        }
        .linha-dupla-print { display: flex; gap: 12px; flex-wrap: wrap; }
        .linha-dupla-print .linha-recibo-print { flex: 1; min-width: 60px; }
        .total-soma-print {
            text-align: center;
            margin: 12px 0;
            font-weight: bold;
            font-size: 16px;
            border-top: 3px solid #333;
            padding-top: 12px;
            width: 100%;
            clear: both;
            color: #1a3a5c;
        }
        .data-print {
            text-align: right;
            font-size: 10px;
            color: #666;
            margin-bottom: 8px;
        }
        .footer-print {
            text-align: center;
            margin-top: 16px;
            font-size: 10px;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 8px;
        }
        .recibo-form-card-print:nth-child(4n) { page-break-after: always; }
        @media print {
            body { padding: 5mm 8mm; }
            .recibo-form-card-print { border: 1px solid #000; padding: 8px 12px; margin: 0 0 4px 0; font-size: 9px; }
            .recibo-form-card-print .linha-recibo-print label { width: 60px; font-size: 8px; }
            .recibo-form-card-print .linha-recibo-print .valor-print { font-size: 9px; padding: 1px 4px; }
        }
        @page { size: A4; margin: 10mm 15mm; }
    </style>
</head>
<body>
    <div class="print-receipt-area">
        <div class="data-print">📅 Gerado em: ${dataStr} às ${horaStr}</div>
        ${recibosHTML}
        <div class="total-soma-print">💰 TOTAL GERAL: ${formatarMoeda(totalGeral)}</div>
        <div class="footer-print">
            DK Telecom - ${cidadeNome} • Total de recibos: ${recibos.length}
        </div>
    </div>
    <script>
        window.onload = function () {
            window.print();
            setTimeout(function () { window.close(); }, 800);
        };
    <\/script>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=900,height=700');
        if (!win) {
            alert('❌ Pop-up bloqueado! Permita pop-ups para este site e tente novamente.');
            return;
        }
        win.document.write(htmlCompleto);
        win.document.close();
        adicionarLog('🖨️ Imprimiu todos os recibos', `${recibos.length} recibos`);
    }

    function imprimirReciboPorId(id) {
        let rec = recibos.find(r => r.id === id);
        if (!rec) { alert('❌ Recibo não encontrado!'); return; }
        let recHTML = gerarHTMLReciboIdentico(rec);
        let win = window.open('', '_blank', 'width=750,height=600');
        if (!win) {
            alert('❌ Pop-up bloqueado! Permita pop-ups para este site e tente novamente.');
            return;
        }
        win.document.write(
            `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibo DK Telecom</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',sans-serif;}body{background:white;padding:20mm;}.recibo-form-card-print{background:#fff;border:1px solid #000;border-radius:20px;padding:20px;max-width:700px;margin:0 auto;}.logo-recibo-print{text-align:center;margin-bottom:24px;border-bottom:1px solid #e9e2d8;padding-bottom:14px;}.logo-recibo-print img{max-width:150px;height:auto;display:block;margin:0 auto;}.recibo-linhas-print{display:flex;flex-direction:column;gap:16px;}.linha-recibo-print{display:flex;align-items:baseline;flex-wrap:wrap;padding-bottom:8px;}.linha-recibo-print label{width:110px;font-size:12px;font-weight:600;}.linha-recibo-print .valor-print{flex:1;border-bottom:1px solid #000;padding:4px 6px;font-size:13px;}.linha-dupla-print{display:flex;gap:24px;flex-wrap:wrap;}.linha-dupla-print .linha-recibo-print{flex:1;}</style></head><body>${recHTML}<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500)}<\/script></body></html>`
        );
        win.document.close();
        adicionarLog('🖨️ Imprimiu recibo', rec.nome || 'Cliente');
    }

    function abrirEdicao(id) {
        let rec = recibos.find(r => r.id === id);
        if (!rec) { alert('❌ Recibo não encontrado!'); return; }
        editandoId = id;
        document.getElementById('editarNome').value = rec.nome || '';
        document.getElementById('editarLogin').value = rec.login || '';
        document.getElementById('editarIdContrato').value = rec.idContrato || '';
        document.getElementById('editarData').value = rec.data || '';
        document.getElementById('editarReferencia').value = rec.referencia || '';
        document.getElementById('editarValor').value = rec.valor || 'R$ 0,00';
        document.getElementById('editarMetodoPagamento').value = rec.metodoPagamento || 'Dinheiro';
        abrirPanel(document.getElementById('panelEditar'));
    }

    function salvarEdicao() {
        if (!editandoId) { alert('❌ Nenhum recibo selecionado para editar!'); return; }
        let rec = recibos.find(r => r.id === editandoId);
        if (!rec) { alert('❌ Recibo não encontrado!'); return; }

        let nome = document.getElementById('editarNome').value.trim().toUpperCase();
        let login = document.getElementById('editarLogin').value.trim();
        let idContrato = document.getElementById('editarIdContrato').value.trim();
        let data = document.getElementById('editarData').value;
        let referencia = document.getElementById('editarReferencia').value;
        let valorRaw = document.getElementById('editarValor').value;
        let metodoPagamento = document.getElementById('editarMetodoPagamento').value;

        if (!nome) { alert('❌ Informe o nome do cliente!'); return; }
        if (!valorRaw || valorRaw === 'R$ 0,00' || valorRaw === '') { alert('❌ Informe o valor do recibo'); return; }

        const nomeAntigo = rec.nome;
        const valorAntigo = rec.valor;
        rec.nome = nome;
        rec.login = login;
        rec.idContrato = idContrato;
        rec.data = data;
        rec.dataFormatada = formatarDataParaExibir(data);
        rec.referencia = referencia;
        rec.referenciaFormatada = formatarDataParaExibir(referencia);
        rec.valor = valorRaw;
        rec.valorNumerico = extrairNumeroDoValor(valorRaw);
        rec.metodoPagamento = metodoPagamento;
        rec.pagamentoParcial = false;

        for (let item of dadosPlanilha) {
            if (item.reciboId === rec.id) {
                item.cliente = capitalizar(nome);
                item.mensalidade = rec.valorNumerico;
                item.metodoPagamento = metodoPagamento;
                item.vencimento = referencia || data || new Date().toISOString().split('T')[0];
                if (login) item.login = login;
                if (idContrato) item.idContrato = idContrato;
                item.pagamentoParcial = false;
            }
        }

        salvarDadosCidade();
        renderizarTabela();
        atualizarCardsResumo();
        adicionarLog('✏️ Editou recibo', `${nomeAntigo} → ${nome}`);
        adicionarAuditoria('Recibo', nome, rec.valorNumerico, `Editou (${nomeAntigo})`);
        alert('✅ Recibo atualizado com sucesso!');
        fecharPanel(document.getElementById('panelEditar'));
        editandoId = null;
    }

    // ============================================================
    // FUNÇÕES DE BACKUP MANUAL
    // ============================================================
    function fazerBackup() {
        try {
            const cidade = getCidadeById(cidadeAtual);
            const dados = {
                cidadeId: cidade.id,
                cidadeNome: cidade.nome,
                planilha: dadosPlanilha,
                recibos: recibos,
                dataBackup: new Date().toISOString(),
                versao: '1.0'
            };
            const json = JSON.stringify(dados, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const dataStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
            const horaStr = new Date().toLocaleTimeString('pt-BR').replace(/:/g, '-');
            link.download = `backup_${cidade.id}_${dataStr}_${horaStr}.json`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            adicionarLog('💾 Backup manual', `${dadosPlanilha.length} registros, ${recibos.length} recibos`);
            alert('✅ Backup manual realizado com sucesso!');
        } catch (e) {
            alert('❌ Erro ao fazer backup: ' + e.message);
        }
    }

    function restaurarBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const dados = JSON.parse(e.target.result);
                if (!dados.planilha || !dados.recibos) { alert('❌ Arquivo de backup inválido!'); return; }
                const cidadeNome = dados.cidadeNome || 'Desconhecida';
                if (!confirm(`⚠️ ATENÇÃO: Isso irá SUBSTITUIR todos os dados atuais.\n\n📍 Cidade: ${cidadeNome}\n📊 ${dados.planilha.length} registros\n📄 ${dados.recibos.length} recibos\n📅 ${new Date(dados.dataBackup).toLocaleString('pt-BR')}\n\nDeseja continuar?`)) return;

                dadosPlanilha = dados.planilha;
                recibos = dados.recibos;
                for (let r of recibos) {
                    if (r.valorNumerico === undefined) r.valorNumerico = extrairNumeroDoValor(r.valor);
                }
                salvarDadosCidade();
                renderizarTabela();
                atualizarCardsResumo();
                carregarRecibos();
                adicionarLog('📂 Restaurou backup', `${dadosPlanilha.length} registros`);
                alert('✅ Backup restaurado com sucesso!');
                fecharPanel(document.getElementById('panelBackup'));
            } catch (err) { alert('❌ Erro ao restaurar backup: ' + err.message); }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function exportarBackupExcel() {
        if (dadosPlanilha.length === 0 && recibos.length === 0) { alert('❌ Nenhum dado para exportar!'); return; }
        try { exportarExcel(); } catch (e) { alert('❌ Erro ao exportar: ' + e.message); }
    }

    function atualizarInfoBackup() {
        const statusEl = document.getElementById('backupStatus');
        if (!statusEl) return;
        const cidade = getCidadeById(cidadeAtual);
        statusEl.innerHTML = `
                📍 <strong>${cidade ? cidade.nome : '—'}</strong><br>
                📊 <strong>${dadosPlanilha.length}</strong> registros<br>
                📄 <strong>${recibos.length}</strong> recibos<br>
                💰 Total: <strong>${formatarMoeda(calcularSomaRecibos())}</strong>
            `;
    }
    // ============================================================
    // EXPORTAR EXCEL - COM FORMATAÇÃO VISUAL COMPLETA
    // ============================================================
    function exportarExcel() {
        if (dadosPlanilha.length === 0) {
            alert('❌ Nenhum dado para exportar!');
            return;
        }

        const wb = XLSX.utils.book_new();
        const dados = [];

        const CORES = {
            cinza: "D9D9D9",
            azul: "DCE6F1",
            verde: "D9EAD3",
            rosa: "F4B6C1",
            cardVerde: "2E7D32",
            cardAmarelo: "FFC000",
            cardAzul: "7EA6F0",
            cardVermelho: "CF2020",
            data: "FFB6C1",
            fluxo: "4EA72E"
        };

        const cidade = getCidadeById(cidadeAtual);
        const cidadeNome = cidade ? cidade.nome.toUpperCase() : 'DK TELECOM';
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const fluxoCaixa = 100;

        // ===== LINHA 0: TÍTULO (10 COLUNAS) =====
        dados.push([
            `PLANILHA DE CAIXA DIÁRIO\nDK TELECOM - ${cidadeNome}`, // A (0)
            "", // B (1)
            "", // C (2)
            "", // D (3)
            "", // E (4)
            "", // F (5)
            dataAtual, // G (6) ← DATA
            "", // H (7)
            `FLUXO DE CAIXA R$${fluxoCaixa.toFixed(2).replace('.', ',')}`, // I (8) ← FLUXO
            ""  // J (9)
        ]);

        // ===== LINHAS VAZIAS (1 a 4) =====
        for (let i = 0; i < 4; i++) {
            dados.push(["", "", "", "", "", "", "", "", "", ""]);
        }

        // ===== LINHA 5: CABEÇALHO =====
        dados.push([
            "VENCIMENTO",
            "CLIENTE",
            "VALOR",
            "INSTALAÇÃO E INSTALADOR",
            "VALOR",
            "DESPESAS",
            "VALOR",
            "DINHEIRO",
            "PIX/CARTÃO",
            "USUÁRIO"
        ]);

        // ===== LINHAS DE DADOS =====
        let totalMensalidades = 0;
        let totalInstalacoes = 0;
        let totalDespesas = 0;
        let totalSangrias = 0;
        let totalDinheiro = 0;
        let totalPix = 0;
        let totalEntradas = 0;

        for (let item of dadosPlanilha) {
            const entrada = (item.mensalidade || 0) + (item.instalacao || 0);

            totalMensalidades += (item.mensalidade || 0);
            totalInstalacoes += (item.instalacao || 0);
            totalDespesas += (item.valorDespesa || 0);
            totalSangrias += (item.sangria || 0);
            totalEntradas += entrada;

            let isDinheiro = false;
            let isPixCartao = false;

            if (item.pagamentoParcial) {
                isDinheiro = (item.valorDinheiro || 0) > 0;
                isPixCartao = (item.valorPix || 0) > 0 || (item.valorCartao || 0) > 0;
                totalDinheiro += (item.valorDinheiro || 0);
                totalPix += (item.valorPix || 0) + (item.valorCartao || 0);
            } else {
                isDinheiro = (item.metodoPagamento === 'Dinheiro');
                isPixCartao = (item.metodoPagamento === 'PIX' || item.metodoPagamento === 'Cartão');
                if (isDinheiro) totalDinheiro += entrada;
                else if (isPixCartao) totalPix += entrada;
            }

            let clienteNome = item.cliente || '';
            let dinheiroMark = isDinheiro ? 'X' : '';
            let pixMark = isPixCartao ? 'X' : '';
            let usuarioNome = item.usuarioId ? getUsuarioNome(item.usuarioId) : (item.usuario || 'Sistema');

            dados.push([
                item.vencimento || "",
                clienteNome,
                (item.mensalidade || 0) > 0 ? formatarMoeda(item.mensalidade) : "",
                item.instalador || "",
                (item.instalacao || 0) > 0 ? formatarMoeda(item.instalacao) : "",
                item.despesas || "",
                (item.valorDespesa || 0) > 0 ? formatarMoeda(item.valorDespesa) : "",
                dinheiroMark,
                pixMark,
                usuarioNome
            ]);
        }

        // ===== LINHAS VAZIAS ATÉ 25 LINHAS =====
        const linhasExtras = Math.max(0, 25 - dadosPlanilha.length);
        for (let i = 0; i < linhasExtras; i++) {
            dados.push(["", "", "", "", "", "", "", "", "", ""]);
        }

        // ===== 1 LINHA VAZIA ENTRE A TABELA E OS CARDS =====
        dados.push(["", "", "", "", "", "", "", "", "", ""]);

        // ===== LINHA DOS CARDS (TÍTULOS) =====
        dados.push([
            "TOTAL DE ENTRADAS",
            "",
            "SALDO EM DINHEIRO",
            "",
            "PIX/CARTÃO",
            "",
            "DESPESAS",
            "",
            "",
            ""
        ]);

        // ===== LINHA DOS CARDS (VALORES) =====
        const totalEntradasCalculado = totalDinheiro + totalPix - totalDespesas;

        dados.push([
            totalEntradasCalculado > 0 ? formatarMoeda(totalEntradasCalculado) : "R$ 0,00",
            "",
            totalDinheiro > 0 ? formatarMoeda(totalDinheiro) : "R$ 0,00",
            "",
            totalPix > 0 ? formatarMoeda(totalPix) : "R$ 0,00",
            "",
            totalDespesas > 0 ? formatarMoeda(totalDespesas) : "R$ 0,00",
            "",
            "",
            ""
        ]);

        // ===== LINHA VAZIA FINAL =====
        dados.push(["", "", "", "", "", "", "", "", "", ""]);

        const ws = XLSX.utils.aoa_to_sheet(dados);

        // ===== MERGES =====
        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 4, c: 5 } }, // Título A-F
            { s: { r: 0, c: 6 }, e: { r: 4, c: 7 } }, // Data G-H
            { s: { r: 0, c: 8 }, e: { r: 4, c: 9 } }  // Fluxo I-J
        ];

        // ===== ESTILO DO CABEÇALHO PRINCIPAL (linhas 0 a 4) =====
        for (let r = 0; r <= 4; r++) {
            for (let c = 0; c <= 9; c++) {
                const cell = XLSX.utils.encode_cell({ r, c });
                if (!ws[cell]) ws[cell] = { t: 's', v: '' };

                // Bordas apenas nas extremidades
                const isTop = r === 0;
                const isBottom = r === 4;
                const isLeft = (c === 0) || (c === 6) || (c === 8);
                const isRight = (c === 5) || (c === 7) || (c === 9);

                const border = {
                    top: isTop ? { style: "medium" } : undefined,
                    bottom: isBottom ? { style: "medium" } : undefined,
                    left: isLeft ? { style: "medium" } : undefined,
                    right: isRight ? { style: "medium" } : undefined
                };

                if (c <= 5) {
                    // Título (A-F)
                    ws[cell].s = {
                        font: { bold: true, sz: 24, name: "Georgia" },
                        alignment: { horizontal: "center", vertical: "center", wrapText: true },
                        fill: { fgColor: { rgb: CORES.cinza } },
                        border: border
                    };
                } else if (c === 6 || c === 7) {
                    // DATA (G-H)
                    ws[cell].s = {
                        font: { bold: true, sz: 18, color: { rgb: "900000" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        fill: { fgColor: { rgb: CORES.data } },
                        border: border
                    };
                } else {
                    // FLUXO DE CAIXA (I-J)
                    ws[cell].s = {
                        font: { bold: true, sz: 14, color: { rgb: "000000" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        fill: { fgColor: { rgb: CORES.fluxo } },
                        border: border
                    };
                }
            }
        }

        // ===== FORÇAR OS VALORES DA DATA E FLUXO (NÃO SOBRESCREVER) =====
        // Data na célula G1 (coluna 6, linha 0)
        const cellG1 = XLSX.utils.encode_cell({ r: 0, c: 6 });
        ws[cellG1].v = dataAtual;
        ws[cellG1].t = 's';

        // Fluxo na célula I1 (coluna 8, linha 0)
        const cellI1 = XLSX.utils.encode_cell({ r: 0, c: 8 });
        ws[cellI1].v = `FLUXO DE CAIXA R$${fluxoCaixa.toFixed(2).replace('.', ',')}`;
        ws[cellI1].t = 's';

        // ===== ESTILO DOS CABEÇALHOS DA TABELA (LINHA 5) =====
        for (let c = 0; c <= 9; c++) {
            const cell = XLSX.utils.encode_cell({ r: 5, c });
            if (!ws[cell]) continue;

            let bg = CORES.cinza;
            if (c === 2 || c === 4) bg = CORES.verde;
            else if (c === 5 || c === 6) bg = CORES.rosa;
            else if (c === 0 || c === 1 || c === 7 || c === 8 || c === 9) bg = CORES.azul;

            ws[cell].s = {
                font: { bold: true, sz: 11 },
                fill: { fgColor: { rgb: bg } },
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: {
                    top: { style: "medium" },
                    bottom: { style: "medium" },
                    left: { style: "thin" },
                    right: { style: "thin" }
                }
            };
        }

        // ===== ESTILO DOS DADOS =====
        const inicioDados = 6;
        const linhaCardTitulo = dados.length - 3;
        const linhaCardValores = dados.length - 2;
        const fimDados = linhaCardTitulo;

        for (let r = inicioDados; r < fimDados; r++) {
            for (let c = 0; c <= 9; c++) {
                const cell = XLSX.utils.encode_cell({ r, c });
                if (!ws[cell]) continue;

                let bgColor = CORES.azul;
                if (c === 2 || c === 4) bgColor = CORES.verde;
                else if (c === 5 || c === 6) bgColor = CORES.rosa;
                else if (c === 7 || c === 8 || c === 9) bgColor = CORES.azul;

                if (c === 1) {
                    let valor = ws[cell].v;
                    let temNome = valor && valor.trim() !== '';
                    ws[cell].s = {
                        font: { sz: temNome ? 14 : 12, bold: temNome ? true : false },
                        fill: { fgColor: { rgb: bgColor } },
                        alignment: { horizontal: "left", vertical: "center" },
                        border: {
                            top: { style: "thin" },
                            bottom: { style: "thin" },
                            left: { style: "thin" },
                            right: { style: "thin" }
                        }
                    };
                } else if (c === 5) {
                    ws[cell].s = {
                        font: { sz: 14, bold: true },
                        fill: { fgColor: { rgb: bgColor } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin" },
                            bottom: { style: "thin" },
                            left: { style: "thin" },
                            right: { style: "thin" }
                        }
                    };
                } else {
                    ws[cell].s = {
                        font: { sz: 12 },
                        fill: { fgColor: { rgb: bgColor } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin" },
                            bottom: { style: "thin" },
                            left: { style: "thin" },
                            right: { style: "thin" }
                        }
                    };
                }
            }
        }

        // ===== ESTILO DOS CARDS =====
        const coresCards = {
            "TOTAL DE ENTRADAS": CORES.cardVerde,
            "SALDO EM DINHEIRO": CORES.cardAmarelo,
            "PIX/CARTÃO": CORES.cardAzul,
            "DESPESAS": CORES.cardVermelho
        };

        const cardsConfig = [
            { titulo: "TOTAL DE ENTRADAS", inicio: 0, fim: 1 },
            { titulo: "SALDO EM DINHEIRO", inicio: 2, fim: 3 },
            { titulo: "PIX/CARTÃO", inicio: 4, fim: 5 },
            { titulo: "DESPESAS", inicio: 6, fim: 9 }
        ];

        for (const card of cardsConfig) {
            ws["!merges"].push({ s: { r: linhaCardTitulo, c: card.inicio }, e: { r: linhaCardTitulo, c: card.fim } });
            ws["!merges"].push({ s: { r: linhaCardValores, c: card.inicio }, e: { r: linhaCardValores, c: card.fim } });

            for (let col = card.inicio; col <= card.fim; col++) {
                const cTit = XLSX.utils.encode_cell({ r: linhaCardTitulo, c: col });
                const cVal = XLSX.utils.encode_cell({ r: linhaCardValores, c: col });

                if (!ws[cTit]) ws[cTit] = { t: 's', v: '' };
                if (!ws[cVal]) ws[cVal] = { t: 's', v: '' };

                const borderLeft = (col === card.inicio) ? { style: "medium" } : undefined;
                const borderRight = (col === card.fim) ? { style: "medium" } : undefined;

                ws[cTit].s = {
                    font: { bold: true, sz: 10, name: "Arial", color: { rgb: "333333" } },
                    fill: { fgColor: { rgb: "EFEFEF" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "medium" },
                        bottom: { style: "thin" },
                        left: borderLeft,
                        right: borderRight
                    }
                };

                let corFonte = card.titulo === "SALDO EM DINHEIRO" ? "000000" : "FFFFFF";

                ws[cVal].s = {
                    font: { bold: true, sz: 18, name: "Georgia", color: { rgb: corFonte } },
                    fill: { fgColor: { rgb: coresCards[card.titulo] } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin" },
                        bottom: { style: "medium" },
                        left: borderLeft,
                        right: borderRight
                    }
                };
            }
        }

        // ===== LARGURA DAS COLUNAS =====
        ws["!cols"] = [
            { wch: 18 }, // A - VENCIMENTO
            { wch: 40 }, // B - CLIENTE
            { wch: 13 }, // C - VALOR
            { wch: 32 }, // D - INSTALAÇÃO E INSTALADOR
            { wch: 13 }, // E - VALOR
            { wch: 22 }, // F - DESPESAS
            { wch: 14 }, // G - VALOR DESPESA
            { wch: 12 }, // H - DINHEIRO
            { wch: 12 }, // I - PIX/CARTÃO
            { wch: 30 }  // J - USUÁRIO
        ];

        // ===== ALTURA DAS LINHAS =====
        ws["!rows"] = Array(5).fill({ hpt: 30 });
        ws["!rows"][5] = { hpt: 18 };

        for (let i = 6; i < fimDados; i++) {
            ws["!rows"][i] = { hpt: 24 };
        }

        ws["!rows"][linhaCardTitulo] = { hpt: 30 };
        ws["!rows"][linhaCardValores] = { hpt: 65 };

        XLSX.utils.book_append_sheet(wb, ws, "Caixa Diário");

        const cidadeId = cidade ? cidade.id : 'diario';
        XLSX.writeFile(wb, `caixa-${cidadeId}-${dataAtual.replace(/\//g, '-')}.xlsx`);

        alert('📊 Excel exportado com sucesso!');
    }
    // ============================================================
    // EXPORTAR PDF
    // ============================================================
    function exportarPDF() {
        if (dadosPlanilha.length === 0) {
            alert('❌ Nenhum dado para exportar!');
            return;
        }

        const cidade = getCidadeById(cidadeAtual);
        const container = document.createElement('div');
        container.style.cssText = 'padding:20px; background:#f2f2f2; font-family:Arial, sans-serif; width:100%;';
        container.innerHTML = gerarHTMLTabela(cidade);
        document.body.appendChild(container);

        // Verificar se html2pdf está disponível
        if (typeof html2pdf === 'undefined') {
            alert('❌ Biblioteca html2pdf não carregada. Tente recarregar a página.');
            document.body.removeChild(container);
            return;
        }

        html2pdf().set({
            margin: 0.2,
            filename: `caixa-${cidade ? cidade.id : 'diario'}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' }
        }).from(container).save().then(function () {
            document.body.removeChild(container);
        }).catch(function (err) {
            document.body.removeChild(container);
            console.error('Erro ao exportar PDF:', err);
            alert('❌ Erro ao exportar PDF: ' + err.message);
        });

        adicionarLog('📄 Exportou PDF', `${dadosPlanilha.length} registros`);
    }


    // GERAR HTML TABELA PARA PDF 
    // ============================================================
    // ============================================================
    // EXPORTAR EXCEL - COM FORMATAÇÃO VISUAL COMPLETA
    // ============================================================
    function exportarExcel() {
        if (dadosPlanilha.length === 0) {
            alert('❌ Nenhum dado para exportar!');
            return;
        }

        const wb = XLSX.utils.book_new();
        const dados = [];

        const CORES = {
            cinza: "D9D9D9",
            azul: "DCE6F1",
            verde: "D9EAD3",
            rosa: "F4B6C1",
            cardVerde: "2E7D32",
            cardAmarelo: "FFC000",
            cardAzul: "7EA6F0",
            cardVermelho: "CF2020",
            data: "FFB6C1",
            fluxo: "4EA72E"
        };

        const cidade = getCidadeById(cidadeAtual);
        const cidadeNome = cidade ? cidade.nome.toUpperCase() : 'DK TELECOM';
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const fluxoCaixa = 100;

        // ===== LINHA 0: TÍTULO =====
        dados.push([
            `PLANILHA DE CAIXA DIÁRIO\nDK TELECOM - ${cidadeNome}`, // A (0)
            "", // B (1)
            "", // C (2)
            "", // D (3)
            "", // E (4)
            "", // F (5)
            dataAtual, // G (6) ← DATA (célula superior esquerda do merge G:H)
            "", // H (7)
            `FLUXO DE CAIXA R$${fluxoCaixa.toFixed(2).replace('.', ',')}`, // I (8) ← FLUXO
            ""  // J (9)
        ]);

        // ===== LINHAS VAZIAS =====
        for (let i = 0; i < 4; i++) {
            dados.push(["", "", "", "", "", "", "", "", "", ""]);
        }

        // ===== LINHA 5: CABEÇALHO =====
        dados.push([
            "VENCIMENTO",
            "CLIENTE",
            "VALOR",
            "INSTALAÇÃO E INSTALADOR",
            "VALOR",
            "DESPESAS",
            "VALOR",
            "DINHEIRO",
            "PIX/CARTÃO",
            "USUÁRIO"
        ]);

        // ===== LINHAS DE DADOS =====
        let totalMensalidades = 0;
        let totalInstalacoes = 0;
        let totalDespesas = 0;
        let totalSangrias = 0;
        let totalDinheiro = 0;
        let totalPix = 0;
        let totalEntradas = 0;

        for (let item of dadosPlanilha) {
            const entrada = (item.mensalidade || 0) + (item.instalacao || 0);
            const saida = (item.valorDespesa || 0) + (item.sangria || 0);

            totalMensalidades += (item.mensalidade || 0);
            totalInstalacoes += (item.instalacao || 0);
            totalDespesas += (item.valorDespesa || 0);
            totalSangrias += (item.sangria || 0);
            totalEntradas += entrada;

            // Verificar se é pagamento parcial
            let isDinheiro = false;
            let isPixCartao = false;

            if (item.pagamentoParcial) {
                isDinheiro = (item.valorDinheiro || 0) > 0;
                isPixCartao = (item.valorPix || 0) > 0 || (item.valorCartao || 0) > 0;
                totalDinheiro += (item.valorDinheiro || 0);
                totalPix += (item.valorPix || 0) + (item.valorCartao || 0);
            } else {
                isDinheiro = (item.metodoPagamento === 'Dinheiro');
                isPixCartao = (item.metodoPagamento === 'PIX' || item.metodoPagamento === 'Cartão');
                if (isDinheiro) totalDinheiro += entrada;
                else if (isPixCartao) totalPix += entrada;
            }

            let clienteNome = item.cliente || '';
            let dinheiroMark = isDinheiro ? 'X' : '';
            let pixMark = isPixCartao ? 'X' : '';
            let usuarioNome = item.usuarioId ? getUsuarioNome(item.usuarioId) : (item.usuario || 'Sistema');

            dados.push([
                item.vencimento || "",
                clienteNome,
                (item.mensalidade || 0) > 0 ? formatarMoeda(item.mensalidade) : "",
                item.instalador || "",
                (item.instalacao || 0) > 0 ? formatarMoeda(item.instalacao) : "",
                item.despesas || "",
                (item.valorDespesa || 0) > 0 ? formatarMoeda(item.valorDespesa) : "",
                dinheiroMark,
                pixMark,
                usuarioNome
            ]);
        }

        // ===== LINHAS VAZIAS ATÉ 25 LINHAS =====
        const linhasExtras = Math.max(0, 25 - dadosPlanilha.length);
        for (let i = 0; i < linhasExtras; i++) {
            dados.push(["", "", "", "", "", "", "", "", "", ""]);
        }

        // ===== 1 LINHA VAZIA ENTRE A TABELA E OS CARDS =====
        dados.push(["", "", "", "", "", "", "", "", "", ""]);

        // ===== LINHA DOS CARDS (TÍTULOS) =====
        dados.push([
            "TOTAL DE ENTRADAS",
            "",
            "SALDO EM DINHEIRO",
            "",
            "PIX/CARTÃO",
            "",
            "DESPESAS",
            "",
            "",
            ""
        ]);

        // ===== LINHA DOS CARDS (VALORES) =====
        const totalEntradasCalculado = totalDinheiro + totalPix - totalDespesas;

        dados.push([
            totalEntradasCalculado > 0 ? formatarMoeda(totalEntradasCalculado) : "R$ 0,00",
            "",
            totalDinheiro > 0 ? formatarMoeda(totalDinheiro) : "R$ 0,00",
            "",
            totalPix > 0 ? formatarMoeda(totalPix) : "R$ 0,00",
            "",
            totalDespesas > 0 ? formatarMoeda(totalDespesas) : "R$ 0,00",
            "",
            "",
            ""
        ]);

        // ===== LINHA VAZIA FINAL =====
        dados.push(["", "", "", "", "", "", "", "", "", ""]);

        const ws = XLSX.utils.aoa_to_sheet(dados);

        // ===== MERGES CORRIGIDOS =====
        ws["!merges"] = [
            // Título: A até F (colunas 0 a 5) — linhas 0 a 4
            { s: { r: 0, c: 0 }, e: { r: 4, c: 5 } },

            // DATA: G + H (colunas 6 e 7) — linhas 0 a 4
            { s: { r: 0, c: 6 }, e: { r: 4, c: 7 } },

            // FLUXO DE CAIXA: I + J (colunas 8 e 9) — linhas 0 a 4
            { s: { r: 0, c: 8 }, e: { r: 4, c: 9 } }
        ];

        // ===== ESTILO DO CABEÇALHO PRINCIPAL =====
        for (let r = 0; r <= 4; r++) {
            for (let c = 0; c <= 9; c++) {
                const cell = XLSX.utils.encode_cell({ r, c });
                if (!ws[cell]) ws[cell] = { t: 's', v: '' };

                if (c <= 5) {
                    ws[cell].s = {
                        font: { bold: true, sz: 24, name: "Georgia" },
                        alignment: { horizontal: "center", vertical: "center", wrapText: true },
                        fill: { fgColor: { rgb: CORES.cinza } },
                        border: { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } }
                    };
                } else if (c === 6) {
                    ws[cell].s = {
                        font: { bold: true, sz: 16, color: { rgb: "900000" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        fill: { fgColor: { rgb: CORES.data } },
                        border: { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } }
                    };
                } else {
                    ws[cell].s = {
                        font: { bold: true, sz: 14, color: { rgb: "000000" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        fill: { fgColor: { rgb: CORES.fluxo } },
                        border: { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "medium" }, right: { style: "medium" } }
                    };
                }
            }
        }


        // ===== FORÇAR VALORES DA DATA E FLUXO (topo-esquerdo dos merges) =====
        const cellG1 = XLSX.utils.encode_cell({ r: 0, c: 6 });
        if (!ws[cellG1]) ws[cellG1] = { t: 's', v: '' };
        ws[cellG1].v = dataAtual;
        ws[cellG1].t = 's';

        const cellI1 = XLSX.utils.encode_cell({ r: 0, c: 8 });
        if (!ws[cellI1]) ws[cellI1] = { t: 's', v: '' };
        ws[cellI1].v = `FLUXO DE CAIXA R$${fluxoCaixa.toFixed(2).replace('.', ',')}`;
        ws[cellI1].t = 's';

        // ===== ESTILO DOS CABEÇALHOS DA TABELA (LINHA 5) =====
        for (let c = 0; c <= 9; c++) {
            const cell = XLSX.utils.encode_cell({ r: 5, c });
            if (!ws[cell]) continue;
            let bg = CORES.cinza;
            if (c === 2 || c === 4) bg = CORES.verde;
            else if (c === 5 || c === 6) bg = CORES.rosa;
            else if (c === 0 || c === 1 || c === 7 || c === 8 || c === 9) bg = CORES.azul;

            ws[cell].s = {
                font: { bold: true, sz: 11 },
                fill: { fgColor: { rgb: bg } },
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: { top: { style: "medium" }, bottom: { style: "medium" }, left: { style: "thin" }, right: { style: "thin" } }
            };
        }

        // ===== ESTILO DOS DADOS =====
        const inicioDados = 6;
        const linhaCardTitulo = dados.length - 3;
        const linhaCardValores = dados.length - 2;
        const fimDados = linhaCardTitulo;

        for (let r = inicioDados; r < fimDados; r++) {
            for (let c = 0; c <= 9; c++) {
                const cell = XLSX.utils.encode_cell({ r, c });
                if (!ws[cell]) continue;
                let bgColor = CORES.azul;
                if (c === 2 || c === 4) bgColor = CORES.verde;
                else if (c === 5 || c === 6) bgColor = CORES.rosa;
                else if (c === 7 || c === 8 || c === 9) bgColor = CORES.azul; // Dinheiro, PIX e Usuário com azul

                if (c === 1) {
                    let valor = ws[cell].v;
                    let temNome = valor && valor.trim() !== '';
                    ws[cell].s = {
                        font: { sz: temNome ? 14 : 12, bold: temNome ? true : false },
                        fill: { fgColor: { rgb: bgColor } },
                        alignment: { horizontal: "left", vertical: "center" },
                        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
                    };
                } else if (c === 5) {
                    ws[cell].s = {
                        font: { sz: 14, bold: true },
                        fill: { fgColor: { rgb: bgColor } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
                    };
                } else {
                    ws[cell].s = {
                        font: { sz: 12 },
                        fill: { fgColor: { rgb: bgColor } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
                    };
                }
            }
        }

        // ===== ESTILO DOS CARDS =====
        const coresCards = {
            "TOTAL DE ENTRADAS": CORES.cardVerde,
            "SALDO EM DINHEIRO": CORES.cardAmarelo,
            "PIX/CARTÃO": CORES.cardAzul,
            "DESPESAS": CORES.cardVermelho
        };

        const cardsConfig = [
            { titulo: "TOTAL DE ENTRADAS", inicio: 0, fim: 1 },
            { titulo: "SALDO EM DINHEIRO", inicio: 2, fim: 3 },
            { titulo: "PIX/CARTÃO", inicio: 4, fim: 5 },
            { titulo: "DESPESAS", inicio: 6, fim: 9 }
        ];

        for (const card of cardsConfig) {
            ws["!merges"].push({ s: { r: linhaCardTitulo, c: card.inicio }, e: { r: linhaCardTitulo, c: card.fim } });
            ws["!merges"].push({ s: { r: linhaCardValores, c: card.inicio }, e: { r: linhaCardValores, c: card.fim } });

            for (let col = card.inicio; col <= card.fim; col++) {
                const cTit = XLSX.utils.encode_cell({ r: linhaCardTitulo, c: col });
                const cVal = XLSX.utils.encode_cell({ r: linhaCardValores, c: col });
                if (!ws[cTit]) ws[cTit] = { t: 's', v: '' };
                if (!ws[cVal]) ws[cVal] = { t: 's', v: '' };

                const borderLeft = (col === card.inicio) ? { style: "medium" } : undefined;
                const borderRight = (col === card.fim) ? { style: "medium" } : undefined;

                ws[cTit].s = {
                    font: { bold: true, sz: 10, name: "Arial", color: { rgb: "333333" } },
                    fill: { fgColor: { rgb: "EFEFEF" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "medium" },
                        bottom: { style: "thin" },
                        left: borderLeft,
                        right: borderRight
                    }
                };

                let corFonte = card.titulo === "SALDO EM DINHEIRO" ? "000000" : "FFFFFF";

                ws[cVal].s = {
                    font: { bold: true, sz: 18, name: "Georgia", color: { rgb: corFonte } },
                    fill: { fgColor: { rgb: coresCards[card.titulo] } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin" },
                        bottom: { style: "medium" },
                        left: borderLeft,
                        right: borderRight
                    }
                };
            }
        }

        // ===== LARGURA DAS COLUNAS =====
        ws["!cols"] = [
            { wch: 18 },  // Coluna A - VENCIMENTO
            { wch: 40 },  // Coluna B - CLIENTE
            { wch: 13 },  // Coluna C - VALOR
            { wch: 32 },  // Coluna D - INSTALAÇÃO E INSTALADOR
            { wch: 13 },  // Coluna E - VALOR
            { wch: 22 },  // Coluna F - DESPESAS
            { wch: 16 },  // Coluna G - VALOR DESPESA
            { wch: 12 },  // Coluna H - DINHEIRO
            { wch: 12 },  // Coluna I - PIX/CARTÃO
            { wch: 21 }   // Coluna J - USUÁRIO
        ];

        // ===== ALTURA DAS LINHAS =====
        ws["!rows"] = Array(5).fill({ hpt: 30 });
        ws["!rows"][5] = { hpt: 18 };
        for (let i = 6; i < fimDados; i++) {
            ws["!rows"][i] = { hpt: 24 };
        }
        ws["!rows"][linhaCardTitulo] = { hpt: 30 };
        ws["!rows"][linhaCardValores] = { hpt: 65 };

        XLSX.utils.book_append_sheet(wb, ws, "Caixa Diário");
        const cidadeId = cidade ? cidade.id : 'diario';
        XLSX.writeFile(wb, `caixa-${cidadeId}-${dataAtual.replace(/\//g, '-')}.xlsx`);
        alert('📊 Excel exportado com sucesso!');
    }

    // ============================================================
    // FUNÇÕES DE IMPRESSÃO E EXPORTAÇÃO DE RECIBOS
    // ============================================================


    function exportarRecibosParaWord() {
        if (recibos.length === 0) { alert('❌ Nenhum recibo para exportar!'); return; }
        const cidade = getCidadeById(cidadeAtual);
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        let totalGeral = calcularSomaRecibos();
        let conteudoTexto = `TOTAL ACUMULADO: ${formatarMoeda(totalGeral)}\n\n`;
        for (let rec of recibos) {
            let metodoStr = rec.pagamentoParcial ?
                `Dinheiro: ${formatarMoeda(rec.valorDinheiro || 0)} | PIX: ${formatarMoeda(rec.valorPix || 0)} | Cartão: ${formatarMoeda(rec.valorCartao || 0)}` :
                rec.metodoPagamento || '';
            conteudoTexto +=
                `NOME: ${rec.nome || ''}\nDATA: ${rec.dataFormatada || ''}\nVALOR: ${rec.valor || ''}\nMÊS REF: ${rec.referenciaFormatada || ''}\nLOGIN: ${rec.login || ''}\nID: ${rec.idContrato || ''}\nPAGAMENTO: ${metodoStr}\n\n`;
        }
        const htmlCompleto =
            `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibos DK ${cidade ? cidade.nome : ''}</title><style>body{font-family:Arial;margin:30px;font-size:12pt;white-space:pre-wrap;}</style></head><body><h2>PRESTAÇÃO DE CONTAS - DK TELECOM ${cidade ? cidade.nome.toUpperCase() : ''}</h2><p>${dataAtual}</p><div style="white-space:pre-wrap;font-family:'Courier New',monospace;">${conteudoTexto.replace(/\n/g, '<br>')}</div></body></html>`;
        const blob = new Blob([htmlCompleto], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download =
            `recibos_${cidade ? cidade.id : 'dk'}_${new Date().toISOString().split('T')[0]}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        adicionarLog('📄 Exportou recibos para Word', `${recibos.length} recibos`);
    }

function exportarRecibosParaExcel() {
    if (recibos.length === 0) {
        alert('❌ Nenhum recibo para exportar!');
        return;
    }

    const cidade = getCidadeById(cidadeAtual);
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const totalGeral = calcularSomaRecibos();
    const mediaPorRecibo = recibos.length > 0 ? totalGeral / recibos.length : 0;

    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>Recibos</x:Name>
                        <x:WorksheetOptions>
                            <x:DisplayGridlines/>
                        </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
            body {
                font-family: Calibri, Arial, sans-serif;
                margin: 0;
                padding: 28px;
                color: #1f2937;
            }
            .header {
                margin-bottom: 32px;
                border-bottom: 4px solid #1e3a5f;
                padding-bottom: 16px;
            }
            .titulo {
                font-size: 30px;
                font-weight: 700;
                color: #1e3a5f;
                margin: 0 0 8px 0;
                letter-spacing: 0.6px;
            }
            .subtitulo {
                font-size: 17px;
                color: #6b7280;
                margin: 0;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                font-size: 16px;
            }
            th {
                background-color: #1e3a5f;
                color: #ffffff;
                font-weight: 700;
                padding: 20px 14px;
                border: 1px solid #1e3a5f;
                text-align: center;
                font-size: 16px;
                letter-spacing: 0.5px;
            }
            td {
                padding: 18px 14px;
                border: 1px solid #d1d5db;
                text-align: center;
                vertical-align: middle;
                font-size: 16px;
            }
            tr:nth-child(even) td {
                background-color: #f8fafc;
            }
            td.nome {
                text-align: left;
                font-weight: 600;
                color: #111827;
                font-size: 16px;
            }
            td.valor {
                text-align: right;
                font-family: 'Consolas', 'Courier New', monospace;
                font-weight: 700;
                font-size: 16px;
            }
            .total-row td {
                background-color: #1e3a5f !important;
                color: #ffffff !important;
                font-weight: 700;
                font-size: 17px;
                border: 1px solid #1e3a5f;
                padding: 20px 14px;
            }
            .resumo-container {
                margin-top: 42px;
            }
            .resumo-titulo {
                font-size: 17px;
                font-weight: 700;
                color: #1e3a5f;
                margin-bottom: 14px;
                letter-spacing: 0.5px;
            }
            .cards {
                border-collapse: separate;
                border-spacing: 14px 0;
                width: 100%;
            }
            .cards td {
                border: none;
                padding: 0;
                width: 25%;
            }
            .card {
                border-radius: 8px;
                padding: 22px 16px;
                text-align: center;
                border: 1px solid transparent;
            }
            .card-label {
                font-size: 13px;
                font-weight: 600;
                letter-spacing: 0.6px;
                text-transform: uppercase;
                margin-bottom: 10px;
                opacity: 0.95;
            }
            .card-value {
                font-size: 26px;
                font-weight: 700;
            }
            .card-azul {
                background-color: #1e3a5f;
                color: #ffffff;
            }
            .card-verde {
                background-color: #166534;
                color: #ffffff;
            }
            .card-amarelo {
                background-color: #b45309;
                color: #ffffff;
            }
            .card-cinza {
                background-color: #374151;
                color: #ffffff;
            }
            .footer {
                margin-top: 42px;
                font-size: 12px;
                color: #9ca3af;
                text-align: center;
                border-top: 1px solid #e5e7eb;
                padding-top: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="titulo">PRESTAÇÃO DE CONTAS — DK TELECOM</div>
            <div class="subtitulo">
                ${cidade ? cidade.nome.toUpperCase() : 'TODAS AS CIDADES'} &nbsp;•&nbsp; ${dataAtual} &nbsp;•&nbsp; ${recibos.length} recibo(s)
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width:28%;">NOME DO CLIENTE</th>
                    <th style="width:13%;">DATA PAGAMENTO</th>
                    <th style="width:13%;">VALOR</th>
                    <th style="width:22%;">FORMA DE PAGAMENTO</th>
                    <th style="width:12%;">LOGIN</th>
                    <th style="width:12%;">ID CONTRATO</th>
                </tr>
            </thead>
            <tbody>`;

    for (let rec of recibos) {
        const valorNum = rec.valorNumerico || extrairNumeroDoValor(rec.valor) || 0;
        let metodoStr = '';

        if (rec.pagamentoParcial) {
            const partes = [];
            if (rec.valorDinheiro > 0) partes.push(`Dinheiro: ${formatarMoeda(rec.valorDinheiro)}`);
            if (rec.valorPix > 0) partes.push(`PIX: ${formatarMoeda(rec.valorPix)}`);
            if (rec.valorCartao > 0) partes.push(`Cartão: ${formatarMoeda(rec.valorCartao)}`);
            metodoStr = partes.join(' | ');
        } else {
            metodoStr = rec.metodoPagamento || '—';
        }

        html += `
                <tr>
                    <td class="nome">${rec.nome || '—'}</td>
                    <td>${rec.dataFormatada || '—'}</td>
                    <td class="valor">R$ ${valorNum.toFixed(2).replace('.', ',')}</td>
                    <td>${metodoStr}</td>
                    <td>${rec.login || '—'}</td>
                    <td>${rec.idContrato || '—'}</td>
                </tr>`;
    }

    html += `
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="2" style="text-align:right; padding-right:18px;">TOTAL GERAL</td>
                    <td class="valor">R$ ${totalGeral.toFixed(2).replace('.', ',')}</td>
                    <td colspan="3"></td>
                </tr>
            </tfoot>
        </table>

        <div class="resumo-container">
            <div class="resumo-titulo">RESUMO EXECUTIVO</div>
            <table class="cards">
                <tr>
                    <td>
                        <div class="card card-azul">
                            <div class="card-label">Total de Recibos</div>
                            <div class="card-value">${recibos.length}</div>
                        </div>
                    </td>
                    <td>
                        <div class="card card-verde">
                            <div class="card-label">Valor Total</div>
                            <div class="card-value">R$ ${totalGeral.toFixed(2).replace('.', ',')}</div>
                        </div>
                    </td>
                    <td>
                        <div class="card card-amarelo">
                            <div class="card-label">Média por Recibo</div>
                            <div class="card-value">R$ ${mediaPorRecibo.toFixed(2).replace('.', ',')}</div>
                        </div>
                    </td>
                    <td>
                        <div class="card card-cinza">
                            <div class="card-label">Cidade</div>
                            <div class="card-value" style="font-size:20px;">${cidade ? cidade.nome.toUpperCase() : 'GERAL'}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="footer">
            Documento gerado automaticamente pelo sistema DK Telecom • ${new Date().toLocaleString('pt-BR')}
        </div>
    </body>
    </html>`;

    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RECIBOS_${cidade ? cidade.id.toUpperCase() : 'DK'}_${dataAtual.replace(/\//g, '-')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    adicionarLog('📊 Exportou recibos para Excel formatado', `${recibos.length} recibos`);
    alert('📊 Recibos exportados com sucesso!');
}

    function excluirTodosRecibos() {
        if (recibos.length === 0) { alert('❌ Nenhum recibo para excluir.'); return; }
        if (confirm('⚠️ ATENÇÃO: Isso irá APAGAR todos os recibos. Deseja continuar?')) {
            recibos = [];
            dadosPlanilha = dadosPlanilha.filter(item => item.origem !== 'recibo');
            salvarDadosCidade();
            renderizarTabela();
            atualizarCardsResumo();
            adicionarLog('🗑️ Excluiu todos os recibos', `${recibos.length} removidos`);
            alert('✅ Todos os recibos foram excluídos!');
        }
    }

    // ============================================================
    // SALVAR RECIBO ATUAL
    // ============================================================
    function salvarReciboAtual() {
        let nome = document.getElementById('reciboNome').value.trim().toUpperCase();
        let login = document.getElementById('reciboLogin').value.trim();
        let idContrato = document.getElementById('reciboIdContrato').value.trim();
        let data = document.getElementById('reciboData').value;
        let referencia = document.getElementById('reciboReferencia').value;
        let valorRaw = document.getElementById('reciboValor').value;
        let metodoPagamento = document.getElementById('reciboMetodoPagamento').value;
        let isParcial = modoParcial;

        if (!nome) { alert('❌ Informe o nome do cliente!'); return; }
        if (!valorRaw || valorRaw === 'R$ 0,00') { alert('❌ Informe o valor do recibo'); return; }

        let valorTotal = extrairNumeroDoValor(valorRaw);
        let dataVencimento = referencia || data || new Date().toISOString().split('T')[0];
        let reciboId = gerarIdUnico();

        let valorDinheiro = 0, valorPix = 0, valorCartao = 0, pagamentoParcial = false;

        if (isParcial) {
            valorDinheiro = extrairNumeroDoValor(document.getElementById('parcialDinheiro').value);
            valorPix = extrairNumeroDoValor(document.getElementById('parcialPix').value);
            valorCartao = extrairNumeroDoValor(document.getElementById('parcialCartao').value);
            let somaParcial = valorDinheiro + valorPix + valorCartao;
            if (Math.abs(somaParcial - valorTotal) > 0.01) {
                alert(
                    `❌ A soma dos valores parciais (${formatarMoeda(somaParcial)}) não é igual ao valor total (${formatarMoeda(valorTotal)})`);
                return;
            }
            pagamentoParcial = true;
        }

        const usuarioId = usuarioLogado ? usuarioLogado.id : null;

        dadosPlanilha.push({
            vencimento: dataVencimento,
            cliente: capitalizar(nome),
            mensalidade: valorTotal,
            instalador: '',
            instalacao: 0,
            despesas: '',
            valorDespesa: 0,
            sangria: 0,
            origem: 'recibo',
            login: login,
            idContrato: idContrato,
            metodoPagamento: metodoPagamento,
            reciboId: reciboId,
            pagamentoParcial: pagamentoParcial,
            valorDinheiro: valorDinheiro,
            valorPix: valorPix,
            valorCartao: valorCartao,
            usuarioId: usuarioId,
            usuario: usuarioLogado ? usuarioLogado.nome : 'Sistema'
        });

        recibos.unshift({
            id: reciboId,
            nome,
            login,
            idContrato,
            data,
            dataFormatada: formatarDataParaExibir(data),
            referencia,
            referenciaFormatada: formatarDataParaExibir(referencia),
            valor: valorRaw,
            valorNumerico: valorTotal,
            metodoPagamento: metodoPagamento,
            pagamentoParcial: pagamentoParcial,
            valorDinheiro: valorDinheiro,
            valorPix: valorPix,
            valorCartao: valorCartao,
            usuarioId: usuarioId,
            usuario: usuarioLogado ? usuarioLogado.nome : 'Sistema'
        });

        salvarDadosCidade();
        renderizarTabela();
        atualizarCardsResumo();
        adicionarLog('📄 Criou recibo', `${nome} - ${valorRaw}`);
        adicionarAuditoria('Recibo', nome, valorTotal, 'Criou', usuarioId);
        alert(`✅ Recibo de ${nome} salvo com sucesso!`);
        limparFormRecibo();
        fecharPanel(document.getElementById('panelRecibo'));
    }

    function imprimirReciboAtualTemp() {
        let nome = document.getElementById('reciboNome').value.trim().toUpperCase() || '______________';
        let login = document.getElementById('reciboLogin').value.trim();
        let idContrato = document.getElementById('reciboIdContrato').value.trim();
        let data = document.getElementById('reciboData').value;
        let referencia = document.getElementById('reciboReferencia').value;
        let valor = document.getElementById('reciboValor').value || 'R$ 0,00';
        let metodoPagamento = document.getElementById('reciboMetodoPagamento').value;
        let isParcial = modoParcial;
        let recTemp = {
            nome, login, idContrato, data, dataFormatada: formatarDataParaExibir(data), referencia,
            referenciaFormatada: formatarDataParaExibir(referencia), valor, metodoPagamento,
            pagamentoParcial: isParcial
        };
        if (isParcial) {
            recTemp.valorDinheiro = extrairNumeroDoValor(document.getElementById('parcialDinheiro').value);
            recTemp.valorPix = extrairNumeroDoValor(document.getElementById('parcialPix').value);
            recTemp.valorCartao = extrairNumeroDoValor(document.getElementById('parcialCartao').value);
        }
        let recHTML = gerarHTMLReciboIdentico(recTemp);
        let win = window.open('', '_blank', 'width=750,height=600');
        win.document.write(
            `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibo DK Telecom</title><style>body{background:white;padding:20mm;font-family:Arial;}.recibo-form-card-print{background:#fff;border:1px solid #000;border-radius:20px;padding:20px;max-width:700px;margin:0 auto;}.logo-recibo-print{text-align:center;margin-bottom:24px;border-bottom:1px solid #ddd;padding-bottom:14px;}.logo-recibo-print img{max-width:150px;height:auto;display:block;margin:0 auto;}.recibo-linhas-print{display:flex;flex-direction:column;gap:16px;}.linha-recibo-print{display:flex;align-items:baseline;flex-wrap:wrap;padding-bottom:8px;}.linha-recibo-print label{width:110px;font-size:12px;font-weight:600;}.linha-recibo-print .valor-print{flex:1;border-bottom:1px solid #000;padding:4px 6px;font-size:13px;}.linha-dupla-print{display:flex;gap:24px;flex-wrap:wrap;}.linha-dupla-print .linha-recibo-print{flex:1;}</style></head><body>${recHTML}<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500)}<\/script></body></html>`
        );
        win.document.close();
    }

    function limparFormRecibo() {
        document.getElementById('reciboNome').value = '';
        document.getElementById('reciboLogin').value = '';
        document.getElementById('reciboIdContrato').value = '';
        document.getElementById('reciboValor').value = '';
        document.getElementById('reciboMetodoPagamento').value = 'Dinheiro';
        document.getElementById('parcialDinheiro').value = '';
        document.getElementById('parcialPix').value = '';
        document.getElementById('parcialCartao').value = '';
        modoParcial = false;
        document.getElementById('parcialArea').style.display = 'none';
        document.getElementById('toggleParcialBtn').textContent = '🔄 Pagamento Dividido';
        document.getElementById('reciboMetodoPagamento').style.display = 'block';
        document.getElementById('totalParcialDisplay').textContent = 'Total: R$ 0,00';
        let hoje = new Date().toISOString().split('T')[0];
        document.getElementById('reciboData').value = hoje;
        document.getElementById('reciboReferencia').value = hoje;
    }

    function preencherDataRecibo() {
        let hoje = new Date().toISOString().split('T')[0];
        if (document.getElementById('reciboData')) document.getElementById('reciboData').value = hoje;
        if (document.getElementById('reciboReferencia')) document.getElementById('reciboReferencia').value = hoje;
    }

    function toggleModoParcial() {
        modoParcial = !modoParcial;
        const parcialArea = document.getElementById('parcialArea');
        const metodoSelect = document.getElementById('reciboMetodoPagamento');
        if (modoParcial) {
            parcialArea.style.display = 'block';
            metodoSelect.style.display = 'none';
            document.getElementById('toggleParcialBtn').textContent = '💰 Pagamento Único';
            calcularTotalParcial();
        } else {
            parcialArea.style.display = 'none';
            metodoSelect.style.display = 'block';
            document.getElementById('toggleParcialBtn').textContent = '🔄 Pagamento Dividido';
            document.getElementById('parcialDinheiro').value = '';
            document.getElementById('parcialPix').value = '';
            document.getElementById('parcialCartao').value = '';
            document.getElementById('totalParcialDisplay').textContent = 'Total: R$ 0,00';
        }
    }

    function calcularTotalParcial() {
        const dinheiro = extrairNumeroDoValor(document.getElementById('parcialDinheiro').value);
        const pix = extrairNumeroDoValor(document.getElementById('parcialPix').value);
        const cartao = extrairNumeroDoValor(document.getElementById('parcialCartao').value);
        const total = dinheiro + pix + cartao;
        const totalEl = document.getElementById('totalParcialDisplay');
        totalEl.textContent = `Total: ${formatarMoeda(total)}`;
        totalEl.style.color = total > 0 ? 'var(--primary)' : 'var(--text-muted)';
    }

    function adicionarRegistro() {
        let cliente = document.getElementById('cliente').value.trim();
        let nomeCliente = cliente ? capitalizar(cliente) : '';
        let mensalidade = parseFloat(document.getElementById('valorMensalidade').value) || 0;
        let instalacao = parseFloat(document.getElementById('valorInstalacao').value) || 0;
        let valorDespesa = parseFloat(document.getElementById('valorDespesa').value) || 0;
        let metodoPagamento = document.getElementById('metodoPagamento').value;

        if (!nomeCliente && (mensalidade > 0 || instalacao > 0)) {
            alert('❌ Informe o nome do cliente!');
            return;
        }
        if (valorDespesa > 0 && !document.getElementById('despesas').value.trim()) {
            alert('❌ Informe o tipo de despesa!');
            return;
        }
        if (mensalidade < 0 || instalacao < 0 || valorDespesa < 0) {
            alert('❌ Valores não podem ser negativos!');
            return;
        }

        const usuarioId = usuarioLogado ? usuarioLogado.id : null;

        dadosPlanilha.push({
            vencimento: document.getElementById('vencimento').value || new Date().toISOString().split('T')[0],
            cliente: nomeCliente,
            mensalidade: mensalidade,
            instalador: capitalizar(document.getElementById('instalador').value.trim()),
            instalacao: instalacao,
            despesas: document.getElementById('despesas').value.trim() ? capitalizar(document.getElementById(
                'despesas').value.trim()) : '',
            valorDespesa: valorDespesa,
            sangria: 0,
            origem: 'manual',
            metodoPagamento: metodoPagamento,
            pagamentoParcial: false,
            usuarioId: usuarioId,
            usuario: usuarioLogado ? usuarioLogado.nome : 'Sistema'
        });

        salvarDadosCidade();
        renderizarTabela();
        atualizarCardsResumo();
        adicionarLog('➕ Adicionou registro', `${nomeCliente || 'Despesa'} - ${formatarMoeda(mensalidade || valorDespesa)}`);
        adicionarAuditoria('Planilha', nomeCliente || 'Despesa', mensalidade || valorDespesa, 'Criou', usuarioId);

        document.getElementById('cliente').value = '';
        document.getElementById('instalador').value = '';
        document.getElementById('valorInstalacao').value = '';
        document.getElementById('despesas').value = '';
        document.getElementById('valorDespesa').value = '';
        document.getElementById('valorMensalidade').value = '0';
        document.getElementById('metodoPagamento').value = 'Dinheiro';
        fecharPanel(document.getElementById('panel'));
        alert('✅ Registro adicionado com sucesso!');
    }

    function limparPlanilha() {
        if (confirm('⚠️ ATENÇÃO: Isso irá APAGAR todos os dados da planilha. Deseja continuar?')) {
            dadosPlanilha = [];
            salvarDadosCidade();
            renderizarTabela();
            atualizarCardsResumo();
            adicionarLog('🗑️ Limpou planilha', 'Todos os registros removidos');
            alert('✅ Planilha limpa com sucesso!');
        }
    }

    // ============================================================
    // FUNÇÕES DE UI
    // ============================================================
    function abrirPanel(p) {
        p.classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }

    function fecharPanel(p) {
        p.classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }

    // ============================================================
    // ADMIN PANEL - FUNÇÕES GLOBAIS
    // ============================================================
    window.adminAcessarCidade = function (id) {
        const cidade = getCidadeById(id);
        if (!cidade) return;
        if (confirm(`🔑 Acessar a cidade ${cidade.nome}?\n\nOs dados atuais serão salvos.`)) {
            salvarDadosCidade();
            carregarDadosCidade(id);
            atualizarInterfaceUsuario();
            fecharPanel(document.getElementById('panelAdmin'));
            adicionarLog('🔀 Mudou de cidade (Admin)', `Para ${cidade.nome}`);
            alert(`✅ Agora você está em ${cidade.nome}`);
        }
    };

    window.adminEditarUsuario = function (id) {
        const user = getUserById(id);
        if (!user) {
            alert('❌ Usuário não encontrado!');
            return;
        }
        document.getElementById('adminFormUsuarioTitulo').textContent = '✏️ Editar Usuário';
        document.getElementById('adminFormUsuarioLogin').value = user.login;
        document.getElementById('adminFormUsuarioLogin').disabled = true;
        document.getElementById('adminFormUsuarioNome').value = user.nome || '';
        document.getElementById('adminFormUsuarioSenha').value = '';
        document.getElementById('adminFormUsuarioSenha').placeholder = '•••••• (deixe em branco para manter)';
        document.getElementById('adminFormUsuarioCidade').value = user.cidade;
        document.getElementById('adminFormUsuarioNivel').value = user.nivel;
        document.getElementById('adminFormUsuarioStatus').value = user.status;
        document.getElementById('adminFormUsuarioSalvar').dataset.editId = id;
        document.getElementById('adminFormUsuario').style.display = 'block';
        document.getElementById('adminNovoUsuario').style.display = 'none';
        popularSelectCidadesAdmin();
    };

    window.adminExcluirUsuario = function (id) {
        const user = getUserById(id);
        if (!user) {
            alert('❌ Usuário não encontrado!');
            return;
        }
        if (user.login === 'admin') {
            alert('❌ Não é possível excluir o usuário administrador principal!');
            return;
        }
        if (confirm(`⚠️ Tem certeza que deseja excluir o usuário "${user.login}"?`)) {
            usuarios = usuarios.filter(u => u.id !== id);
            salvarUsuarios();
            atualizarAdminUsuarios();
            adicionarLog('🗑️ Excluiu usuário', `${user.login}`);
            alert('✅ Usuário excluído!');
        }
    };

    window.adminEditarCidade = function (id) {
        const cidade = getCidadeById(id);
        if (!cidade) {
            alert('❌ Cidade não encontrada!');
            return;
        }
        document.getElementById('adminFormCidadeTitulo').textContent = '✏️ Editar Cidade';
        document.getElementById('adminFormCidadeNome').value = cidade.nome;
        document.getElementById('adminFormCidadeEstado').value = cidade.estado || 'PE';
        document.getElementById('adminFormCidadeResponsavel').value = cidade.responsavel || '';
        document.getElementById('adminFormCidadeSalvar').dataset.editId = id;
        document.getElementById('adminFormCidade').style.display = 'block';
        document.getElementById('adminNovaCidade').style.display = 'none';
    };

    window.adminExcluirCidade = function (id) {
        const cidade = getCidadeById(id);
        if (!cidade) {
            alert('❌ Cidade não encontrada!');
            return;
        }
        const usuariosCidade = usuarios.filter(u => u.cidade === id);
        if (usuariosCidade.length > 0) {
            alert(`❌ Não é possível excluir "${cidade.nome}" pois existem ${usuariosCidade.length} usuários vinculados.`);
            return;
        }
        if (confirm(`⚠️ Tem certeza que deseja excluir a cidade "${cidade.nome}"?`)) {
            cidade.ativo = false;
            salvarCidades();
            atualizarAdminCidades();
            popularSelectCidadesAdmin();
            popularSelectCidadesLogin();
            adicionarLog('🗑️ Excluiu cidade', `${cidade.nome}`);
            alert('✅ Cidade excluída!');
        }
    };

    function atualizarAdminDashboard() {
        const cidadesAtivas = cidades.filter(c => c.ativo !== false);
        document.getElementById('adminTotalCidades').textContent = cidadesAtivas.length;
        document.getElementById('adminTotalUsuarios').textContent = usuarios.filter(u => u.status === 'ativo').length;

        let totalEntradas = 0, totalDespesas = 0;
        for (let cidade of cidadesAtivas) {
            const chave = getChaveCidade(cidade.id, 'dados_planilha');
            try {
                const dados = localStorage.getItem(chave);
                if (dados) {
                    const planilha = JSON.parse(dados);
                    for (let item of planilha) {
                        totalEntradas += (item.mensalidade || 0) + (item.instalacao || 0);
                        totalDespesas += (item.valorDespesa || 0) + (item.sangria || 0);
                    }
                }
            } catch (e) { }
        }
        document.getElementById('adminTotalEntradas').textContent = formatarMoeda(totalEntradas);
        document.getElementById('adminTotalDespesas').textContent = formatarMoeda(totalDespesas);
        const resultado = totalEntradas - totalDespesas;
        document.getElementById('adminResultadoGlobal').textContent = formatarMoeda(resultado);
        const resEl = document.getElementById('adminResultadoGlobal');
        if (resultado > 0) resEl.style.color = 'var(--success)';
        else if (resultado < 0) resEl.style.color = 'var(--danger)';
        else resEl.style.color = 'var(--primary)';

        const tbody = document.getElementById('adminResumoCidades');
        let html = '';
        for (let cidade of cidadesAtivas) {
            let entradas = 0, despesas = 0, count = 0;
            const usuariosCidade = usuarios.filter(u => u.cidade === cidade.id && u.status === 'ativo').length;
            const chave = getChaveCidade(cidade.id, 'dados_planilha');
            try {
                const dados = localStorage.getItem(chave);
                if (dados) {
                    const planilha = JSON.parse(dados);
                    count = planilha.length;
                    for (let item of planilha) {
                        entradas += (item.mensalidade || 0) + (item.instalacao || 0);
                        despesas += (item.valorDespesa || 0) + (item.sangria || 0);
                    }
                }
            } catch (e) { }
            const res = entradas - despesas;
            const cor = res > 0 ? 'var(--success)' : res < 0 ? 'var(--danger)' : 'var(--text-muted)';
            html += `<tr>
                    <td><strong>${cidade.nome}</strong></td>
                    <td>${usuariosCidade}</td>
                    <td>${count}</td>
                    <td>${formatarMoeda(entradas)}</td>
                    <td>${formatarMoeda(despesas)}</td>
                    <td style="color:${cor};font-weight:bold;">${formatarMoeda(res)}</td>
                    <td><button class="btn-sm success" onclick="adminAcessarCidade('${cidade.id}')">🔑 Acessar</button></td>
                </tr>`;
        }
        tbody.innerHTML = html;
    }

    function atualizarAdminUsuarios() {
        const tbody = document.getElementById('adminTabelaUsuarios');
        let html = '';
        for (let u of usuarios) {
            const cidadeNome = getCidadeNome(u.cidade);
            const statusCor = u.status === 'ativo' ? 'var(--success)' : 'var(--danger)';
            const nivelLabel = u.nivel === 'admin' ? '🛡️ Admin' : '👤 Usuário';
            html += `<tr>
                    <td><strong>${u.login}</strong></td>
                    <td>${u.nome || '—'}</td>
                    <td>${cidadeNome}</td>
                    <td>${nivelLabel}</td>
                    <td style="color:${statusCor};font-weight:600;">${u.status === 'ativo' ? '✅ Ativo' : '⛔ Inativo'}</td>
                    <td>
                        <button class="btn-sm primary" onclick="adminEditarUsuario('${u.id}')">✏️</button>
                        <button class="btn-sm danger" onclick="adminExcluirUsuario('${u.id}')">🗑️</button>
                    </td>
                </tr>`;
        }
        tbody.innerHTML = html;
    }

    function adminSalvarUsuario() {
        const login = document.getElementById('adminFormUsuarioLogin').value.trim();
        const nome = document.getElementById('adminFormUsuarioNome').value.trim();
        const senha = document.getElementById('adminFormUsuarioSenha').value;
        const cidade = document.getElementById('adminFormUsuarioCidade').value;
        const nivel = document.getElementById('adminFormUsuarioNivel').value;
        const status = document.getElementById('adminFormUsuarioStatus').value;
        const editId = document.getElementById('adminFormUsuarioSalvar').dataset.editId;

        if (!login) { alert('❌ Informe o usuário!'); return; }
        if (!nome) { alert('❌ Informe o nome!'); return; }

        if (editId) {
            const user = getUserById(editId);
            if (!user) { alert('❌ Usuário não encontrado!'); return; }
            if (login !== user.login && usuarios.find(u => u.login === login)) {
                alert('❌ Este usuário já existe!');
                return;
            }
            user.login = login;
            user.nome = nome;
            if (senha) user.senha = senha;
            user.cidade = cidade;
            user.nivel = nivel;
            user.status = status;
            salvarUsuarios();
            adicionarLog('✏️ Editou usuário', `${login}`);
            alert('✅ Usuário atualizado!');
        } else {
            if (usuarios.find(u => u.login === login)) {
                alert('❌ Este usuário já existe!');
                return;
            }
            if (!senha) { alert('❌ Informe uma senha!'); return; }
            usuarios.push({
                id: gerarIdUnico(),
                login,
                senha,
                nome,
                cidade,
                nivel,
                status
            });
            salvarUsuarios();
            adicionarLog('➕ Criou usuário', `${login}`);
            alert('✅ Usuário criado!');
        }

        document.getElementById('adminFormUsuario').style.display = 'none';
        document.getElementById('adminNovoUsuario').style.display = 'block';
        document.getElementById('adminFormUsuarioLogin').disabled = false;
        document.getElementById('adminFormUsuarioSalvar').dataset.editId = '';
        document.getElementById('adminFormUsuarioSenha').placeholder = '••••••••';
        atualizarAdminUsuarios();
        popularSelectCidadesAdmin();
        atualizarAdminDashboard();
    }

    function adminCancelarUsuario() {
        document.getElementById('adminFormUsuario').style.display = 'none';
        document.getElementById('adminNovoUsuario').style.display = 'block';
        document.getElementById('adminFormUsuarioLogin').disabled = false;
        document.getElementById('adminFormUsuarioSalvar').dataset.editId = '';
        document.getElementById('adminFormUsuarioSenha').placeholder = '••••••••';
    }

    function atualizarAdminCidades() {
        const tbody = document.getElementById('adminTabelaCidades');
        let html = '';
        for (let c of cidades) {
            if (c.ativo === false) continue;
            const usuariosCidade = usuarios.filter(u => u.cidade === c.id && u.status === 'ativo').length;
            let count = 0;
            const chave = getChaveCidade(c.id, 'dados_planilha');
            try {
                const dados = localStorage.getItem(chave);
                if (dados) count = JSON.parse(dados).length;
            } catch (e) { }
            const statusCor = c.ativo !== false ? 'var(--success)' : 'var(--danger)';
            html += `<tr>
                    <td><strong>${c.nome}</strong></td>
                    <td>${c.estado || 'PE'}</td>
                    <td>${c.responsavel || '—'}</td>
                    <td>${usuariosCidade}</td>
                    <td>${count}</td>
                    <td style="color:${statusCor};font-weight:600;">${c.ativo !== false ? '✅ Ativo' : '⛔ Inativo'}</td>
                    <td>
                        <button class="btn-sm primary" onclick="adminEditarCidade('${c.id}')">✏️</button>
                        <button class="btn-sm danger" onclick="adminExcluirCidade('${c.id}')">🗑️</button>
                    </td>
                </tr>`;
        }
        tbody.innerHTML = html;
    }

    function adminSalvarCidade() {
        const nome = document.getElementById('adminFormCidadeNome').value.trim();
        const estado = document.getElementById('adminFormCidadeEstado').value.trim().toUpperCase();
        const responsavel = document.getElementById('adminFormCidadeResponsavel').value.trim();
        const editId = document.getElementById('adminFormCidadeSalvar').dataset.editId;

        if (!nome) { alert('❌ Informe o nome da cidade!'); return; }
        if (!estado || estado.length !== 2) { alert('❌ Informe o estado (2 letras)'); return; }

        const id = nome.toLowerCase().replace(/[^a-z]/g, '');

        if (editId) {
            const cidade = getCidadeById(editId);
            if (!cidade) { alert('❌ Cidade não encontrada!'); return; }
            cidade.nome = capitalizar(nome);
            cidade.estado = estado;
            cidade.responsavel = responsavel;
            cidade.ativo = true;
            salvarCidades();
            adicionarLog('✏️ Editou cidade', `${capitalizar(nome)}`);
            alert('✅ Cidade atualizada!');
        } else {
            if (cidades.find(c => c.id === id)) {
                alert('❌ Esta cidade já existe!');
                return;
            }
            cidades.push({
                id: id,
                nome: capitalizar(nome),
                estado: estado,
                responsavel: responsavel,
                ativo: true
            });
            salvarCidades();
            adicionarLog('➕ Criou cidade', `${capitalizar(nome)}`);
            alert('✅ Cidade criada!');
        }

        document.getElementById('adminFormCidade').style.display = 'none';
        document.getElementById('adminNovaCidade').style.display = 'block';
        document.getElementById('adminFormCidadeSalvar').dataset.editId = '';
        atualizarAdminCidades();
        popularSelectCidadesAdmin();
        popularSelectCidadesLogin();
        atualizarAdminDashboard();
    }

    function adminCancelarCidade() {
        document.getElementById('adminFormCidade').style.display = 'none';
        document.getElementById('adminNovaCidade').style.display = 'block';
        document.getElementById('adminFormCidadeSalvar').dataset.editId = '';
    }

    function atualizarAdminAuditoria() {
        const tbody = document.getElementById('adminTabelaAuditoria');
        if (!tbody) return;

        if (auditoria.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">Nenhum registro de auditoria encontrado</td></tr>';
            return;
        }

        let html = '';
        const limite = 100;
        const items = auditoria.slice(0, limite);
        for (let item of items) {
            const valor = item.valor || 0;
            html += `<tr>
                    <td style="font-size:10px;">${item.dataFormatada || '—'}</td>
                    <td>${item.cidade || '—'}</td>
                    <td><strong>${item.usuarioNome || 'Sistema'}</strong></td>
                    <td>${item.cliente || '—'}</td>
                    <td>${formatarMoeda(valor)}</td>
                    <td><span class="audit-badge">${item.tipo || '—'}</span></td>
                    <td>${item.acao || '—'}</td>
                </tr>`;
        }
        tbody.innerHTML = html;
    }

    function exportarAuditoria() {
        if (auditoria.length === 0) {
            alert('❌ Nenhum registro de auditoria para exportar!');
            return;
        }

        const wb = XLSX.utils.book_new();
        const dados = [
            ['Data', 'Cidade', 'Usuário', 'Cliente', 'Valor', 'Tipo', 'Ação']
        ];

        for (let item of auditoria) {
            dados.push([
                item.dataFormatada || '—',
                item.cidade || '—',
                item.usuarioNome || 'Sistema',
                item.cliente || '—',
                formatarMoeda(item.valor || 0),
                item.tipo || '—',
                item.acao || '—'
            ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(dados);
        ws["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        XLSX.writeFile(wb, `AUDITORIA_DK_${dataAtual}.xlsx`);
        adicionarLog('📊 Exportou auditoria', `${auditoria.length} registros`);
        alert('✅ Auditoria exportada com sucesso!');
    }

    function limparAuditoria() {
        if (auditoria.length === 0) { alert('❌ Nenhum registro para limpar!'); return; }
        if (confirm('⚠️ ATENÇÃO: Isso irá APAGAR todos os registros de auditoria. Deseja continuar?')) {
            auditoria = [];
            salvarAuditoria();
            atualizarAdminAuditoria();
            adicionarLog('🗑️ Limpou auditoria', 'Todos os registros removidos');
            alert('✅ Auditoria limpa com sucesso!');
        }
    }

    // ============================================================
    // FUNÇÕES DE POPULATE
    // ============================================================
    function popularSelectCidadesAdmin() {
        const select = document.getElementById('adminFormUsuarioCidade');
        select.innerHTML = '';
        for (let c of cidades) {
            if (c.ativo === false) continue;
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nome;
            select.appendChild(opt);
        }
    }

    function popularSelectCidadesLogin() {
        const select = document.getElementById('loginCidade');
        select.innerHTML = '';
        for (let c of cidades) {
            if (c.ativo === false) continue;
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nome;
            select.appendChild(opt);
        }
        if (select.options.length > 0) select.selectedIndex = 0;
    }

    function atualizarLogsUI() {
        const container = document.getElementById('adminLogEntries');
        if (!container) return;
        if (logs.length === 0) {
            container.innerHTML =
                '<div style="color:var(--text-muted);text-align:center;padding:16px;">Nenhum log registrado</div>';
            return;
        }
        let html = '';
        for (let log of logs) {
            html += `<div class="log-entry">
                    <span class="log-time">[${log.dataFormatada}]</span>
                    <span class="log-cidade">${log.cidade}</span>
                    <span class="log-usuario">${log.usuarioNome || log.usuario || 'Sistema'}</span>
                    <span class="log-action">${log.acao}</span>
                    ${log.detalhes ? ` - ${log.detalhes}` : ''}
                </div>`;
        }
        container.innerHTML = html;
    }

    // ============================================================
    // ATUALIZAR INTERFACE DO USUÁRIO
    // ============================================================
    function atualizarInterfaceUsuario() {
        const cidade = getCidadeById(cidadeAtual);
        const cidadeNome = cidade ? cidade.nome : '—';
        const nomeUser = usuarioLogado ? (usuarioLogado.nome || usuarioLogado.login) : 'Carregando...';
        const primeiroNome = (nomeUser || '').split(' ')[0] || 'Usuário';

        // Sidebar (logo permanece no HTML)
        const sidebarEl = document.getElementById('sidebarCidade');
        if (sidebarEl) {
            sidebarEl.textContent = cidadeNome !== '—' ? `📍 ${cidadeNome}` : '📍 Sem cidade';
        }

        // Saudação com animação suave
        const welcomeEl = document.getElementById('headerWelcome');
        const cidadeEl = document.getElementById('headerCidade');
        const userEl = document.getElementById('headerUsuario');

        if (welcomeEl) {
            welcomeEl.textContent = `👋 Olá, ${primeiroNome}!`;
            welcomeEl.classList.remove('animating');
            void welcomeEl.offsetWidth; // reinicia animação
            welcomeEl.classList.add('animating');
        }
        if (cidadeEl) {
            cidadeEl.textContent = cidadeNome !== '—'
                ? `Caixa diário · ${cidadeNome}`
                : 'Caixa diário';
            cidadeEl.classList.remove('animating');
            void cidadeEl.offsetWidth;
            cidadeEl.classList.add('animating');
        }
        if (userEl) {
            userEl.innerHTML = `👤 <strong>${nomeUser}</strong>`;
            userEl.classList.remove('animating');
            void userEl.offsetWidth;
            userEl.classList.add('animating');
        }

        // Paineis
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setTxt('panelCidadeNome', cidadeNome);
        setTxt('reciboPanelCidade', cidadeNome);
        setTxt('historicoCidade', cidadeNome);
        setTxt('backupCidade', cidadeNome);

        const btnAdmin = document.getElementById('btnAdmin');
        if (btnAdmin) {
            btnAdmin.style.display = (usuarioLogado && usuarioLogado.nivel === 'admin') ? 'flex' : 'none';
        }

        renderizarTabela();
        atualizarCardsResumo();
        carregarRecibos();
        atualizarInfoBackup();
    }

    // ============================================================
    // FUNÇÕES DE ENVIO DE EMAIL E VISUALIZAÇÃO
    // ============================================================
    function enviarPorEmail() {
        if (dadosPlanilha.length === 0 && recibos.length === 0) {
            alert('❌ Nenhum dado para enviar!');
            return;
        }
        const cidade = getCidadeById(cidadeAtual);
        const emailDestino = 'dkgeralfinanceiro@gmail.com';
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const assunto =
            `PRESTAÇÃO DE CONTAS DK TELECOM-${cidade ? cidade.nome.toUpperCase() : 'BUÍQUE'} (${dataAtual})`;

        let corpoEmail = '';
        if (recibos.length > 0) {
            corpoEmail += `📄 LISTA DE RECIBOS - ${cidade ? cidade.nome.toUpperCase() : 'DK'}\n`;
            corpoEmail += '-'.repeat(40) + '\n\n';
            recibos.forEach((rec, index) => {
                let metodoStr = rec.pagamentoParcial ?
                    `Dinheiro: ${formatarMoeda(rec.valorDinheiro || 0)} | PIX: ${formatarMoeda(rec.valorPix || 0)} | Cartão: ${formatarMoeda(rec.valorCartao || 0)}` :
                    rec.metodoPagamento || '';
                corpoEmail += `${index + 1}. NOME: ${rec.nome || '—'}\n`;
                corpoEmail += `   DATA: ${rec.dataFormatada || rec.data || '—'}\n`;
                corpoEmail += `   VALOR: ${rec.valor || 'R$ 0,00'}\n`;
                corpoEmail += `   PAGAMENTO: ${metodoStr}\n`;
                corpoEmail += `   LOGIN: ${rec.login || '—'}\n`;
                corpoEmail += `   ID: ${rec.idContrato || '—'}\n\n`;
            });
            const totalRecibos = calcularSomaRecibos();
            corpoEmail += '-'.repeat(40) + '\n';
            corpoEmail += `💰 TOTAL GERAL RECIBOS: ${formatarMoeda(totalRecibos)}\n\n`;
        }
        corpoEmail += `📍 Cidade: ${cidade ? cidade.nome : '—'}\n`;
        corpoEmail += `📅 Data: ${dataAtual}\n`;
        corpoEmail += 'Atenciosamente,\n';
        corpoEmail += `DK Telecom - ${cidade ? cidade.nome : 'Buíque'}`;

        const gmailLink =
            `https://mail.google.com/mail/?view=cm&fs=1&to=${emailDestino}&su=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpoEmail)}`;
        window.open(gmailLink, '_blank');
        adicionarLog('📧 Enviou e-mail', `Para: ${emailDestino}`);
    }

    function visualizarDados() {
        if (dadosPlanilha.length === 0) { alert('❌ Nenhum dado para visualizar!'); return; }
        salvarDadosCidade();
        window.open('tabela/tabela.html', '_blank');
    }

    // ============================================================
    // TEMA
    // ============================================================
    function aplicarTema(tema) {
        theme = tema;
        document.documentElement.setAttribute('data-theme', tema);
        localStorage.setItem('dk_theme', tema);
        const btnTheme = document.getElementById('btnToggleTheme');
        const label = document.getElementById('themeLabel');
        if (tema === 'dark') {
            btnTheme.querySelector('.icon').textContent = '☀️';
            label.textContent = 'Tema Claro';
        } else {
            btnTheme.querySelector('.icon').textContent = '🌙';
            label.textContent = 'Tema Escuro';
        }
    }

    function toggleTheme() {
        const novoTema = theme === 'light' ? 'dark' : 'light';
        aplicarTema(novoTema);
        adicionarLog('🎨 Tema alterado', novoTema === 'dark' ? 'Escuro' : 'Claro');
    }

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    document.addEventListener('DOMContentLoaded', function () {
        aplicarTema(theme);
        document.getElementById('dataAtual').innerText = new Date().toLocaleDateString('pt-BR');
        document.getElementById('vencimento').value = new Date().toISOString().split('T')[0];

        carregarUsuarios();
        carregarCidades();
        carregarLogs();
        carregarAuditoria();
        popularSelectCidadesLogin();

        if (verificarSessao()) {
            document.getElementById('loginContainer').classList.add('hidden');
            document.getElementById('appLayout').style.display = 'flex';
            carregarDadosCidade(cidadeAtual);
            if (dadosPlanilha.length === 0) restaurarBackupAutomatico();
            atualizarInterfaceUsuario();
            preencherDataRecibo();
            adicionarLog('🔓 Sessão restaurada', usuarioLogado ? usuarioLogado.nome : 'Sistema');
        }

        // ============================================================
        // EVENT LISTENERS
        // ============================================================

        // Login
        document.getElementById('btnLogin').addEventListener('click', function () {
            const login = document.getElementById('loginUsuario').value.trim();
            const senha = document.getElementById('loginSenha').value;
            const cidade = document.getElementById('loginCidade').value;

            if (!login || !senha) {
                document.getElementById('loginError').textContent = '❌ Preencha usuário e senha!';
                document.getElementById('loginError').classList.add('show');
                return;
            }

            if (fazerLogin(login, senha, cidade)) {
                document.getElementById('loginContainer').classList.add('hidden');
                document.getElementById('appLayout').style.display = 'flex';
                carregarDadosCidade(cidade);
                if (dadosPlanilha.length === 0) restaurarBackupAutomatico();
                atualizarInterfaceUsuario();
                preencherDataRecibo();
            }
        });

        document.getElementById('loginSenha').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') document.getElementById('btnLogin').click();
        });
        document.getElementById('loginUsuario').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') document.getElementById('loginSenha').focus();
        });

        // Logout
        document.getElementById('btnLogout').addEventListener('click', logout);

        // Sidebar
        document.getElementById('btnAbrirPanel').addEventListener('click', function () {
            abrirPanel(document.getElementById('panel'));
        });
        document.getElementById('btnRecibo').addEventListener('click', function () {
            limparFormRecibo();
            abrirPanel(document.getElementById('panelRecibo'));
        });
        document.getElementById('btnHistorico').addEventListener('click', function () {
            abrirPanel(document.getElementById('panelHistorico'));
        });
        document.getElementById('btnVisualizar').addEventListener('click', visualizarDados);
        document.getElementById('btnWord').addEventListener('click', exportarExcel);
        document.getElementById('btnExportarPDF').addEventListener('click', exportarPDF);
        document.getElementById('btnEnviarEmail').addEventListener('click', enviarPorEmail);
        document.getElementById('btnLimparTudo').addEventListener('click', limparPlanilha);
        document.getElementById('btnToggleTheme').addEventListener('click', toggleTheme);

        // Backup
        document.getElementById('btnBackup').addEventListener('click', function () {
            abrirPanel(document.getElementById('panelBackup'));
            atualizarInfoBackup();
        });
        document.getElementById('btnFazerBackup').addEventListener('click', fazerBackup);
        document.getElementById('btnRestaurarBackup').addEventListener('click', function () {
            document.getElementById('inputRestaurarBackup').click();
        });
        document.getElementById('inputRestaurarBackup').addEventListener('change', restaurarBackup);
        document.getElementById('btnExportarBackupExcel').addEventListener('click', exportarBackupExcel);
        document.getElementById('btnSalvarRecibosFormatadosBackup').addEventListener('click', salvarRecibosFormatados);

        // Admin
        document.getElementById('btnAdmin').addEventListener('click', function () {
            if (usuarioLogado && usuarioLogado.nivel === 'admin') {
                abrirPanel(document.getElementById('panelAdmin'));
                atualizarAdminDashboard();
                atualizarAdminUsuarios();
                atualizarAdminCidades();
                atualizarAdminAuditoria();
                atualizarLogsUI();
                popularSelectCidadesAdmin();
            } else {
                alert('❌ Acesso negado! Apenas administradores podem acessar.');
            }
        });

        // Admin Tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                const tabName = this.dataset.tab;
                const contentId = 'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
                document.getElementById(contentId).classList.add('active');
                if (tabName === 'dashboard') atualizarAdminDashboard();
                if (tabName === 'usuarios') atualizarAdminUsuarios();
                if (tabName === 'cidades') atualizarAdminCidades();
                if (tabName === 'auditoria') atualizarAdminAuditoria();
                if (tabName === 'logs') atualizarLogsUI();
            });
        });

        // Admin - Usuários
        document.getElementById('adminNovoUsuario').addEventListener('click', function () {
            document.getElementById('adminFormUsuarioTitulo').textContent = '➕ Novo Usuário';
            document.getElementById('adminFormUsuarioLogin').value = '';
            document.getElementById('adminFormUsuarioLogin').disabled = false;
            document.getElementById('adminFormUsuarioNome').value = '';
            document.getElementById('adminFormUsuarioSenha').value = '';
            document.getElementById('adminFormUsuarioSenha').placeholder = '••••••••';
            document.getElementById('adminFormUsuarioCidade').value = cidades.length > 0 ? cidades[0].id : '';
            document.getElementById('adminFormUsuarioNivel').value = 'usuario';
            document.getElementById('adminFormUsuarioStatus').value = 'ativo';
            document.getElementById('adminFormUsuarioSalvar').dataset.editId = '';
            document.getElementById('adminFormUsuario').style.display = 'block';
            this.style.display = 'none';
            popularSelectCidadesAdmin();
        });
        document.getElementById('adminFormUsuarioSalvar').addEventListener('click', adminSalvarUsuario);
        document.getElementById('adminFormUsuarioCancelar').addEventListener('click', adminCancelarUsuario);

        // Admin - Cidades
        document.getElementById('adminNovaCidade').addEventListener('click', function () {
            document.getElementById('adminFormCidadeTitulo').textContent = '➕ Nova Cidade';
            document.getElementById('adminFormCidadeNome').value = '';
            document.getElementById('adminFormCidadeEstado').value = 'PE';
            document.getElementById('adminFormCidadeResponsavel').value = '';
            document.getElementById('adminFormCidadeSalvar').dataset.editId = '';
            document.getElementById('adminFormCidade').style.display = 'block';
            this.style.display = 'none';
        });
        document.getElementById('adminFormCidadeSalvar').addEventListener('click', adminSalvarCidade);
        document.getElementById('adminFormCidadeCancelar').addEventListener('click', adminCancelarCidade);

        // Admin - Auditoria
        document.getElementById('adminExportarAuditoria').addEventListener('click', exportarAuditoria);
        document.getElementById('adminLimparAuditoria').addEventListener('click', limparAuditoria);

        // Recibo
        document.getElementById('btnSalvarRecibo').addEventListener('click', salvarReciboAtual);
        document.getElementById('btnImprimirRecibo').addEventListener('click', imprimirReciboAtualTemp);
        document.getElementById('btnAdicionarPrincipal').addEventListener('click', adicionarRegistro);
        document.getElementById('btnImprimirTodos').addEventListener('click', imprimirTodosRecibos);
        document.getElementById('btnExportarRecibosWord').addEventListener('click', exportarRecibosParaWord);
        document.getElementById('btnExportarRecibosExcel').addEventListener('click', exportarRecibosParaExcel);
        document.getElementById('btnExcluirTodosRecibos').addEventListener('click', excluirTodosRecibos);
        document.getElementById('btnSalvarEdicao').addEventListener('click', salvarEdicao);
        document.getElementById('btnSalvarRecibosFormatados').addEventListener('click', salvarRecibosFormatados);
        document.getElementById('toggleParcialBtn').addEventListener('click', toggleModoParcial);

        // Formatação de valor
        document.getElementById('reciboValor').addEventListener('input', function () { formatarInputMoeda(this); });
        document.getElementById('editarValor').addEventListener('input', function () { formatarInputMoeda(this); });
        document.getElementById('parcialDinheiro').addEventListener('input', function () {
            formatarInputMoeda(this);
            calcularTotalParcial();
        });
        document.getElementById('parcialPix').addEventListener('input', function () {
            formatarInputMoeda(this);
            calcularTotalParcial();
        });
        document.getElementById('parcialCartao').addEventListener('input', function () {
            formatarInputMoeda(this);
            calcularTotalParcial();
        });

        // ============================================================
        // CLOSE BUTTONS - CORRIGIDO
        // ============================================================
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();

                // Lista de todos os painéis possíveis
                const paineis = [
                    'panel-adicionar',
                    'panel-recibo',
                    'panel-historico',
                    'panel-editar',
                    'panel-backup',
                    'panel-admin'
                ];

                let panel = null;
                for (let p of paineis) {
                    const el = this.closest('.' + p);
                    if (el) {
                        panel = el;
                        break;
                    }
                }

                if (panel) {
                    fecharPanel(panel);
                } else {
                    console.warn('Close button: painel não encontrado');
                }
            });
        });

        // ============================================================
        // OVERLAY
        // ============================================================
        document.getElementById('overlay').addEventListener('click', function () {
            document.querySelectorAll(
                '.panel-adicionar.show, .panel-recibo.show, .panel-historico.show, .panel-editar.show, .panel-backup.show, .panel-admin.show'
            ).forEach(p => fecharPanel(p));
        });

        // ============================================================
        // TECLADO
        // ============================================================
        document.addEventListener('keydown', function (e) {
            if (document.getElementById('appLayout').style.display === 'none') return;
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                document.getElementById('btnAbrirPanel').click();
            }
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                document.getElementById('btnRecibo').click();
            }
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                document.getElementById('btnWord').click();
            }
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                document.getElementById('btnExportarPDF').click();
            }
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                document.getElementById('btnBackup').click();
            }
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                document.getElementById('btnAdmin').click();
            }
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                logout();
            }
            if (e.key === 'Escape') {
                document.querySelectorAll(
                    '.panel-adicionar.show, .panel-recibo.show, .panel-historico.show, .panel-editar.show, .panel-backup.show, .panel-admin.show'
                ).forEach(p => fecharPanel(p));
            }
        });

        // ============================================================
        // ORDENAÇÃO
        // ============================================================
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', function () {
                const sortKey = this.dataset.sort;
                if (currentSort.column === sortKey) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = sortKey;
                    currentSort.direction = 'asc';
                }
                renderizarTabela();
                document.querySelectorAll('.sortable .sort-icon').forEach(icon => icon.textContent = '↕');
                const icon = this.querySelector('.sort-icon');
                if (icon) icon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
            });
        });

        // ============================================================
        // BACKUP AUTOMÁTICO
        // ============================================================
        setInterval(() => { fazerBackupAutomatico(); }, 5 * 60 * 1000);

        console.log('🚀 Sistema DK Telecom Multi-Cidades iniciado!');
        console.log('👤 Usuário:', usuarioLogado ? usuarioLogado.nome : 'Não logado');
        console.log('📍 Cidade:', getCidadeById(cidadeAtual) ? getCidadeById(cidadeAtual).nome : '—');
        console.log('📊 Registros:', dadosPlanilha.length);
        console.log('📄 Recibos:', recibos.length);
        console.log('🔍 Auditoria:', auditoria.length);
    });

})();
