export const calcularTotalCompra=(productos)=>{

    const totalBruto = productos.reduce((acc,p)=>acc+p.precio,0);
    let descuento = 0;

    for(const producto of productos){
        if(producto.categoria === 'tecnologia') descuento += 0.15;
        if(producto.categoria === 'hogar') descuento += 0.05;
    }

    if (totalBruto > 1000) descuento += 0.10;

    descuento = Math.min(descuento, 0.30);

    const total = totalBruto * (1-descuento);

    return Number(total.toFixed(2));

}