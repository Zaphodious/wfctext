# WFC, for text

This is the Wave Form Collapse algo, implimented
as far as tileset mode, for text. 

visit https://zaphodious.github.io/wfctext/ for a
live demonstration.

This began as an adaptation of the very simple version by Robert Heaton here https://robertheaton.com/2018/12/17/wavefunction-collapse-algorithm/. The heart of the algo is still this simple riff on his implimentation.

Next, tilesets! The program reads in tilesets defined in text files, and chops them up into discrete tiles. Each tile is mapped to a unique symbol, and those symbols are then used by the algo to generate a map. Once the algo is done doing its work, I convert the symbols back into tiles.

Bonus feature: if indicated, the program will fill the edges of the map with the tile in the bottom right of the tileset. This makes things a little better for roguelikes, as it results in discrete rooms rather then open areas on the edge of the map. The results in the demo page are all done with this edge fill 'on'.