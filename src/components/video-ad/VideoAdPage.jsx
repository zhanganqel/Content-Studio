import { Clapperboard } from 'lucide-react';
import { adaptivePageLayout } from '../layoutClasses.js';
import Button from '../ui/Button.jsx';
import PageHeader from '../ui/PageHeader.jsx';

export default function VideoAdPage({ onOpenVideoGeneration, t }) {
  const copy = t.videoAd;

  return (
    /* 视频广告模块当前提供进入视频生成占位页的入口。 */
    <div className={`mx-auto max-w-[1600px] ${adaptivePageLayout.pageStack}`}>
      <PageHeader
        actions={
          <Button icon={Clapperboard} onClick={onOpenVideoGeneration}>
            {copy.createVideo}
          </Button>
        }
        description={copy.description}
        title={copy.title}
      />
    </div>
  );
}
