export const printReceipt = (sale: any, storeName: string) => {
  const printWindow = window.open('', '', 'width=600,height=600');
  
  if (!printWindow) return;

  // Formatações
  const date = new Date(sale.createdAt).toLocaleString('pt-BR');
  const total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(sale.total));
  
  // Traduz método de pagamento
  const getPaymentName = (method: string) => {
      const map: any = { 'MONEY': 'DINHEIRO', 'CREDIT_CARD': 'CARTÃO CRÉDITO', 'DEBIT_CARD': 'CARTÃO DÉBITO', 'PIX': 'PIX', 'CREDIT_STORE': 'FIADO / CREDIÁRIO' };
      return map[method] || method;
  };

  // HTML do Recibo (Estilo Cupom)
  const htmlContent = `
    <html>
      <head>
        <title>Recibo #${sale.id.slice(0, 6)}</title>
        <style>
          @page { margin: 0; size: auto; }
          body { 
            font-family: 'Courier New', Courier, monospace; /* Fonte monoespaçada estilo cupom */
            width: 80mm; /* Largura padrão térmica */
            margin: 0;
            padding: 10px;
            font-size: 12px;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          .flex { display: flex; justify-content: space-between; }
          .items { margin: 10px 0; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; }
        </style>
      </head>
      <body>
        
        <div class="center bold" style="font-size: 14px; margin-bottom: 5px;">${storeName.toUpperCase()}</div>
        <div class="center">RECIBO NÃO-FISCAL</div>
        <div class="center" style="font-size: 10px;">Data: ${date}</div>
        
        <div class="line"></div>

        ${sale.customer ? `
          <div>CLIENTE: ${sale.customer.name}</div>
          ${sale.customer.cpf ? `<div>CPF: ${sale.customer.cpf}</div>` : ''}
          <div class="line"></div>
        ` : '<div>CONSUMIDOR NÃO IDENTIFICADO</div><div class="line"></div>'}

        <div class="items">
          <div class="flex bold" style="margin-bottom: 5px;">
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
          ${sale.items.map((item: any) => `
            <div class="item-row">
              <span>${item.quantity}x ${item.product?.name || 'Item'}</span>
              <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.price) * item.quantity)}</span>
            </div>
          `).join('')}
        </div>

        <div class="line"></div>

        <div class="flex bold" style="font-size: 16px;">
          <span>TOTAL</span>
          <span>${total}</span>
        </div>
        
        <div class="flex" style="margin-top: 5px;">
          <span>Pagamento:</span>
          <span>${getPaymentName(sale.paymentMethod)}</span>
        </div>

        ${sale.paymentMethod === 'CREDIT_STORE' ? `
          <div style="margin-top: 5px; font-weight: bold; text-align: center;">*** CONTA A PRAZO ***</div>
        ` : ''}

        <div class="footer">
          <p>Obrigado pela preferência!</p>
          <p>Volte Sempre</p>
          <p style="font-size: 8px; margin-top: 5px;">Sistema Stoq+</p>
        </div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};