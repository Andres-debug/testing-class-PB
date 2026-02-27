import { Inventario } from "../inventario";

describe('Inventario', () => {

    test('registra entrada de producto',()=>{
        const inv = new Inventario(10);
        inv.entrada(5);
        expect(inv.stock).toBe(15);
        expect(inv.historial).toEqual([{tipo: 'entrada', cantidad: 5}]);
    })
})