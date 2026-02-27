import { calcularTotalCompra  } from "../calcularTotalCompra";

describe ('Motor de precios', ()=>{

    test('aplica descuento por categoria tecnologia',()=>{
       const productos = [ 
        {
            precio:500, 
            categoria:'tecnologia'
        }];

        expect(calcularTotalCompra(productos)).toBe(425)
    });

    test('aplica multiples descuentos acumulados',()=>{

        const productos = [
            {precio: 800, categoria: 'tecnologia'},
            {precio: 300, categoria: 'hogar'}
        ]

        // descuento categoria + descuento por total > 1000
        expect(calcularTotalCompra(productos)).toBe(770)
    })


})