"use strict";
const {initializeApp,applicationDefault}=require("firebase-admin/app");
const {getAuth}=require("firebase-admin/auth");
initializeApp({credential:applicationDefault(),projectId:"klk-familia"});
async function main(){
  const auth=getAuth(),config=await auth.projectConfigManager().getProjectConfig();
  const providers=Array.isArray(config.multiFactorConfig?.providerConfigs)?[...config.multiFactorConfig.providerConfigs]:[];
  const withoutTotp=providers.filter(provider=>!provider.totpProviderConfig);
  withoutTotp.push({state:"ENABLED",totpProviderConfig:{adjacentIntervals:1}});
  await auth.projectConfigManager().updateProjectConfig({multiFactorConfig:{providerConfigs:withoutTotp}});
  process.stdout.write("TOTP quedó habilitado en Identity Platform para klk-familia.\\n");
}
main().catch(error=>{console.error("No se pudo habilitar TOTP:",error?.code||error?.message||"error desconocido");process.exitCode=1;});
