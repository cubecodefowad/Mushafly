// Runs before hydration so the first paint already has the right theme, mushaf
// design and text sizes. It reads both the current key and the pre-rename one,
// so readers who set preferences before the Mushafly rename keep them.
const script = `(function(){try{
function read(){
  var keys=["mushafly.settings.v1","ayah.settings.v1"];
  for(var i=0;i<keys.length;i++){
    var raw=localStorage.getItem(keys[i]);
    if(raw)return raw;
  }
  return null;
}
var raw=read();
var s=raw?JSON.parse(raw):{};
var root=document.documentElement;
var theme=s.theme==="light"||s.theme==="dark"||s.theme==="system"?s.theme:"system";
var dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
root.classList.toggle("dark",dark);
root.dataset.theme=theme;
root.dataset.mushaf=["madinah","andalus","ottoman"].indexOf(s.mushaf)>-1?s.mushaf:"plain";
if(typeof s.arabicSize==="number"&&isFinite(s.arabicSize)){root.style.setProperty("--arabic-size",Math.min(56,Math.max(24,Math.round(s.arabicSize)))+"px");}
if(typeof s.translationSize==="number"&&isFinite(s.translationSize)){root.style.setProperty("--translation-size",Math.min(26,Math.max(14,Math.round(s.translationSize)))+"px");}
}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
