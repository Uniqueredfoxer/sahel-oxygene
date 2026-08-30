import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, CheckCircle2 } from 'lucide-react';

export default function PadSignature({ onChange }) {
  const padRef = useRef(null);
  const [aSigne, setASigne] = useState(false);

  const effacer = () => {
    padRef.current?.clear();
    setASigne(false);
    onChange?.(null);
  };

  const terminer = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      setASigne(true);
      onChange?.(padRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative card overflow-hidden bg-white border-2 border-dashed border-slate-200 hover:border-sahel-300 transition-colors">
        <SignatureCanvas
          ref={padRef}
          penColor="#0F172A"
          canvasProps={{ className: 'w-full h-44 touch-none cursor-crosshair' }}
          onEnd={terminer}
        />
        {!aSigne && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-4">
            <div className="w-3/4 border-b border-slate-200 mb-1" />
            <span className="text-xs text-slate-400 font-medium">Signer sur la ligne ci-dessus</span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center px-1">
        <button
          type="button"
          onClick={effacer}
          className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Effacer</span>
        </button>
        {aSigne && (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Signature enregistrée</span>
          </span>
        )}
      </div>
    </div>
  );
}
