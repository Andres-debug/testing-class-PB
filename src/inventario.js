export class Inventario {

    constructor(stockInicial){
        this.stock = stockInicial;
        this.historial = [];
    }

    entrada(cantidad){
        if(cantidad <= 0) throw new Error('Cantidad invalida')
        this.stock += cantidad;
        this.historial.push({tipo: 'entrada', cantidad});
    }

    salida(cantidad){
        if(cantidad <= 0) throw new Error('Cantidad invalida')
        if(cantidad > this.stock) throw new Error('Stock insuficiente')
        this.stock -= cantidad;
        this.historial.push({tipo: 'salida', cantidad});
    }

}