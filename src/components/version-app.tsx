// Versión instalada y actualización OTA activa, al pie de Mi cuenta. Para soporte: "¿qué
// versión tenés?" se contesta mirando esta línea. En web no hay versión nativa.
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { T } from '@/components/ui';

export function VersionApp() {
  const nativa = Application.nativeApplicationVersion;
  if (!nativa) return null;
  const ota = Updates.updateId ? ` · act. ${Updates.updateId.slice(0, 8)}` : '';
  return (
    <T v="chico" style={{ fontSize: 12, textAlign: 'center' }}>
      Versión {nativa} ({Application.nativeBuildVersion}){ota}
    </T>
  );
}
