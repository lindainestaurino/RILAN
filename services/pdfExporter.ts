import { Material, StockMovement, SalesForecast } from '../types';

// Let TypeScript know about the global jsPDF variable from the script tag
declare const jspdf: any;

const createStyledDoc = (title: string, onAddTables: (doc: any) => void) => {
    const doc = new jspdf.jsPDF();

    // Call the callback to add tables and content
    onAddTables(doc);

    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;

    // Add header and footer to all pages
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Header
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text('RILAN - Controle de Estoque', 14, 22, { baseline: 'top' });
        doc.setFontSize(12);
        doc.text(title, 14, 30, { baseline: 'top' });
        doc.setDrawColor(30, 144, 144); // Teal
        doc.line(14, 38, pageWidth - 14, 38);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth - 14,
            287,
            { align: 'right' }
        );
        doc.text(
            `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
            14,
            287
        );
    }
    
    return doc;
};

const tableStyles = {
    headStyles: { fillColor: [30, 144, 144] }, // Teal color
    bodyStyles: { textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [241, 245, 249] }, // Slate 100
    startY: 45,
};

export const exportStockBalance = (materials: Material[]) => {
    const title = 'Relatório de Saldo de Estoque';
    const doc = createStyledDoc(title, (doc) => {
        const tableData = materials.map(m => [
            m.code,
            m.description,
            m.currentStock,
            m.minStock,
            m.stockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ]);

        doc.autoTable({
            head: [['Código', 'Descrição', 'Estoque Atual', 'Estoque Mínimo', 'Valor do Estoque']],
            body: tableData,
            ...tableStyles,
        });
    });

    doc.save('relatorio_saldo_estoque.pdf');
};

export const exportLowStockItems = (materials: Material[]) => {
    const title = 'Relatório de Itens Abaixo do Mínimo';
    const doc = createStyledDoc(title, (doc) => {
        const lowStockMaterials = materials.filter(m => m.currentStock < m.minStock);
        const tableData = lowStockMaterials.map(m => [
            m.code,
            m.description,
            m.currentStock,
            m.minStock,
            m.purchaseRecommendation
        ]);

        doc.autoTable({
            head: [['Código', 'Descrição', 'Estoque Atual', 'Estoque Mínimo', 'Recomendação']],
            body: tableData,
            ...tableStyles,
        });
    });
    
    doc.save('relatorio_itens_abaixo_minimo.pdf');
};

export const exportMovementsByPeriod = (movements: StockMovement[]) => {
    const title = 'Relatório de Movimentações';
    const doc = createStyledDoc(title, (doc) => {
        const tableData = movements.map(m => [
            new Date(m.movedAt).toLocaleString('pt-BR'),
            m.materialDescription,
            m.type,
            m.reason.replace('+', ' (+)').replace('-', ' (-)'),
            m.quantity,
            m.createdBy
        ]);

        doc.autoTable({
            head: [['Data', 'Material', 'Tipo', 'Motivo', 'Qtd', 'Usuário']],
            body: tableData,
            ...tableStyles,
        });
    });
    
    doc.save('relatorio_movimentacoes.pdf');
};

export const exportKardex = (material: Material, movements: StockMovement[]) => {
    const title = `Extrato de Material (Kardex)`;
    const doc = createStyledDoc(title, (doc) => {
        doc.setFontSize(10);
        doc.text(`Material: ${material.code} - ${material.description}`, 14, 40, { baseline: 'top' });

        const materialMovements = movements
            .filter(m => m.materialId === material.id)
            .sort((a, b) => new Date(a.movedAt).getTime() - new Date(b.movedAt).getTime());

        let currentBalance = material.currentStock - materialMovements.reduce((acc, m) => acc + (m.type === 'entrada' ? m.quantity : -m.quantity), 0);
        
        const tableData = materialMovements.map(m => {
            const quantityChange = m.type === 'entrada' ? m.quantity : -m.quantity;
            currentBalance += quantityChange;
            return [
                new Date(m.movedAt).toLocaleString('pt-BR'),
                m.type.toUpperCase(),
                m.reason.replace('+', ' (+)').replace('-', ' (-)'),
                quantityChange,
                currentBalance
            ];
        });

        tableData.unshift(['-', 'SALDO INICIAL', '-', '-', material.currentStock - materialMovements.reduce((acc, m) => acc + (m.type === 'entrada' ? m.quantity : -m.quantity), 0)]);

        doc.autoTable({
            head: [['Data', 'Tipo', 'Motivo', 'Movimentação', 'Saldo Final']],
            body: tableData,
            ...tableStyles,
            startY: 50,
        });
    });

    doc.save(`kardex_${material.code}.pdf`);
};

export const exportSalesForecast = (forecast: SalesForecast[]) => {
    const title = 'Previsão de Vendas (Análise IA)';
    const doc = createStyledDoc(title, (doc) => {
        const tableData = forecast.map(f => [
            `#${f.predictedRank}`,
            f.materialDescription,
            f.justification
        ]);

        doc.autoTable({
            head: [['Ranking', 'Material', 'Justificativa da IA']],
            body: tableData,
            ...tableStyles,
            columnStyles: {
                2: { cellWidth: 80 }, // Increase width for justification column
            }
        });
    });

    doc.save('previsao_vendas_ia.pdf');
};
