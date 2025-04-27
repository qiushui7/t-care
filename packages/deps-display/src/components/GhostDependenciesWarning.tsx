import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface GhostDependenciesWarningProps {
  ghostDependencies: Record<string, string[]>;
}

const GhostDependenciesWarning: React.FC<GhostDependenciesWarningProps> = ({ ghostDependencies }) => {
  const { t } = useTranslation();

  if (!ghostDependencies || Object.keys(ghostDependencies).length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-l-4 border-t border-r border-b border-amber-200 rounded-r-md p-2.5 mb-3 text-sm shadow-sm">
      <div className="flex items-start">
        <AlertTriangle className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1 overflow-hidden">
          <div className="font-medium text-amber-800 mb-1.5">{t('ghostDependenciesWarning')}</div>
          <div className="flex flex-wrap text-xs text-amber-700 gap-y-1 gap-x-3">
            {Object.entries(ghostDependencies).map(([project, deps]) => (
              <div key={project} className="mb-1 max-w-full">
                <span className="font-medium">{project}:</span>{' '}
                <span className="break-all">{deps.join(', ')}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-1.5 italic opacity-90">{t('ghostDependenciesDescription')}</p>
        </div>
      </div>
    </div>
  );
};

export default GhostDependenciesWarning; 