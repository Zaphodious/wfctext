
export function* range(start,end){
    let mod = start<end ? i=>i+1 : i=> i-1
    let com = start<end ? i=>i<end : i=>i>end
    for (let i = start; com(i); i=mod(i)) {
        yield i
    }
}


export const chars = '☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼!"#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀ɑϐᴦᴨ∑ơµᴛɸϴΩẟ∞∅∈∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■'

export async function dolater() {
    let waittime = Math.random() * 5
    let prom = new Promise((resolve,reject)=>{
        let wait = setTimeout(() => {
            clearTimeout(wait)
            resolve(true)
        }, waittime)
    })
    return prom
}