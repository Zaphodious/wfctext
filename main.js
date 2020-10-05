import {make_simple_grid} from './build.js'
import {pull_tileset, expand_computed_map} from './makerules.js'
import {range} from './util.js'

class MapMaker {
    constructor() {
        this.tilesets = {}
    }
    async add_tileset(name, tileseturl, tilewidth, tileheight, spacing, last_surrounds = false) {
        let [mapping, rules] = await pull_tileset(tileseturl, tilewidth, tileheight, spacing, last_surrounds)
        this.tilesets[name] = {
            mapping, rules
        }
        return this
    }
    async generate(tileset_name, width, height) {
        let ts = this.tilesets[tileset_name]
        let map = await make_simple_grid(ts.rules, width, height)
        let expanded = expand_computed_map(map, ts.mapping)
        return expanded
    }
}

async function testit() {
    let m = new MapMaker()
    for (let i of range(0,3)) {
        drr(m, i)
    }

}
async function drr(mapmaker, i) {
    let m = mapmaker
    await m.add_tileset(`dungeon${i+1}`,`./tileset${i+1}.txt`, 3, 3, 1, true)
    let map = await m.generate(`dungeon${i+1}`, 12, 12)
    let strmap = map.map(row=>row.join('')).join('\n')
    console.log(strmap)
    console.log(i)
    let elem = document.querySelector(`#example${i}`)
    elem.textContent = strmap
}

if (self.testtime) {
    console.log('testing this!')
    testit()
}