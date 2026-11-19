import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=readFileSync(new URL('../leon-ai-effects/beard-styles.js',import.meta.url),'utf8');
const context={window:{}};vm.runInNewContext(source,context);
const catalog=context.window.KLKBeardStyles;
assert.equal(catalog.all.length,12);
assert.equal(catalog.availableForCamera,false,'Experimental renderer must remain disabled in public camera');
for(const style of catalog.all){
 assert.ok(style.id&&style.name);
 assert.ok(style.regions.length>0);
 assert.ok(style.density>0&&style.density<=1);
 assert.ok(style.lengthMm>0);
 assert.equal(catalog.get(style.id),style);
}
assert.equal(catalog.get('unknown'),null);
const renderer=readFileSync(new URL('../leon-ai-effects/beard-webgl3d.js',import.meta.url),'utf8');
new vm.Script(renderer);
assert.match(renderer,/function setStyle\(id\)/);
assert.match(renderer,/style\.regions\.includes\(region\)/);
assert.match(renderer,/selectedStyle='full'/);
console.log('12 beard presets and renderer wiring: PASS');
