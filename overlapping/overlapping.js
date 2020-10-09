import MapMaker from '../main.js'
import {pull_examplemap} from '../makerules.js'

async function main() {
    let mm = new MapMaker()
    await mm.add_from_example('examplemap', './gravitas.txt', 3, 3)
    let map = await mm.generate('examplemap', 12, 12)
    let downmap = map.filter((row,y)=>y%3!=0)
    downmap = downmap.map(row=>row.filter((cell,x)=>x%3!=0))
    let strmap = downmap.map(row=>row.join('')).join('\n')
    document.querySelector('#example1').textContent = strmap
}
main()