const fs = require('fs')
const readLine = require('readline')

const expresion = /^(\bDeclarar\b)([ ]+[a-z\sA-Z\s\_\s]+)([=][ ]+[a-z\sA-Z\s\d\s]+)?[\.\b]/


const tablaSimbolos = [
    'sumar',
    'con',
    '=',
]

const lexer = str => {
    return str.split(' ').map(item => {
        //if (!item.toString().startsWith('//')) {
        if (!(/(^\/\/)/.test(item.toString()))) {
            return item.trim();
        }
    })
}

const parser = tokens => {

    let posicionTokenActual = 0;

    const parseNumero = () => ({ valor: parseInt(tokens[posicionTokenActual++]), tipo: 'numero' });

    const parseOperador = () => {
        const nodo = {
            valor: tokens[posicionTokenActual++],
            tipo: 'operador',
            expresion: []
        };
        while (tokens[posicionTokenActual]) {
            nodo.expresion.push(parseExpresion());
        }
        return nodo;
    };

    const parseExpresion = () => /\d/.test(tokens[posicionTokenActual]) ? parseNumero() : parseOperador();

    return parseExpresion();
};


const transpilar = arbol => {
    const mapOperador = { sumar: '+', restar: '-', multiplicar: '*', divivir: '/' };
    const transpilarNodo = arbol => arbol.tipo === 'numero' ? transpilarNumero(arbol) : transpilarOperador(arbol);
    const transpilarNumero = arbol => arbol.valor;
    const transpilarOperador = arbol => `${arbol.expresion.map(transpilarNodo).join(' ' + mapOperador[arbol.valor] + ' ')}`;
    return transpilarOperador(arbol);
};


const analizadorSintactico = async () => {
    const filestream = fs.createReadStream('./main.compilador')

    const rl = readLine.createInterface({ input: filestream, crlfDelay: Infinity });

    let numeroLinea = 1
    let resultado = []
    let erroresCompilacion = []

    for await (const linea of rl) {

        //console.log("transpilacion: ", numeroLinea, resultado)
        const error = !(expresion.test(linea)) ? `Sintaxis incorrecta en la fila ${numeroLinea}` : undefined

        if (error) {
            erroresCompilacion.push(error)
        } else {
            resultado.push(
                `console.log(${transpilar(parser(lexer(linea)))})`)
        }
        numeroLinea++
    }
    return { resultado, erroresCompilacion };
}

analizadorSintactico().then(({ resultado, erroresCompilacion }) => {
    console.log(resultado)
    console.log(erroresCompilacion)
    if (erroresCompilacion.count > 0) {
        console.error('Error de compilación: ', erroresCompilacion.join('\n'))
        return
    } else {
        fs.writeFile('./salida.js', resultado.join('\n'), (err) => {
            if (err) {
                console.error('Error al guardar la salida', err)
                return
            }
            console.log("Compilación completa")
        })
    }
}
)

//https://codemacaw.com/2020/02/02/create-a-simple-compiler-with-javascript/