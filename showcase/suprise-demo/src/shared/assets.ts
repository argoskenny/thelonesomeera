/** Scene entry pages live one directory below the homepage, including under a deployment subpath. */
export function assetUrl(scope:'shared'|'afterlight'|'night-market'|'vertigo'|'ignition'|'aerie'|'summertide'|'aurelia'|'neo-taipei'|'kowloon',name:string){
  return new URL(`../assets/${scope}/${name}`,document.baseURI).href;
}
