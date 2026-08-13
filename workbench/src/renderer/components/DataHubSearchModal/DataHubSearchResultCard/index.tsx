import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';
import { PiCaretCircleDown, PiCaretCircleUp } from 'react-icons/pi';

import type { DataHubSearchResult } from '../models';

interface DataHubSearchResultCardProps {
  datasetDetails: DataHubSearchResult,
  expanded: boolean,
  onToggleExpanded: () => void,
  onSelect: (url: string) => void,
}

export default function DataHubSearchResultCard(
  props: DataHubSearchResultCardProps
) {
  const {
    datasetDetails,
    expanded,
    onToggleExpanded,
    onSelect,
  } = props;

  const { t } = useTranslation();

  const {
    id, title, description, tags, places, license,
    author, lastUpdated, created, dataHubUrl
  } = datasetDetails;

  const descriptionPreview = description.slice(0, 430) + '…';
  // const shortDescriptionPreview = description.slice(0, 170) + '…';

  return (
    <div className={`search-result ${expanded ? 'search-result-expanded' : ''}`}>
      <div className="search-result-header">
        <h2 className="h5 m-0" id={`${id}-title`}>{title}</h2>
        <div className="search-result-controls">
          <Button
            aria-describedby={`${id}-title`}
            aria-expanded={expanded}
            aria-controls={`${id}-details`}
            onClick={onToggleExpanded}
            variant="secondary"
            className="details-button"
          >
            {expanded ? <PiCaretCircleUp /> : <PiCaretCircleDown />}
            {t('Details')}
          </Button>
          <Button
            onClick={() => onSelect(dataHubUrl)}
            aria-describedby={`${id}-title`}
          >
            {t('Select')}
          </Button>
        </div>
      </div>
      {
        expanded &&
        <div id={`${id}-details`}>
          <p>
            {descriptionPreview}
          </p>
          <dl className="search-result-metadata">
            <dt>{t('Tags')}</dt>
            <dd>{tags.join(', ')}</dd>
            <dt>{t('Places')}</dt>
            <dd>{places.join(', ')}</dd>
            <dt>{t('License')}</dt>
            <dd>{license}</dd>
            <dt>{t('Author')}</dt>
            <dd>{author}</dd>
            <dt>{t('Last Updated')}</dt>
            <dd>{lastUpdated.toString()}</dd>
            <dt>{t('Created')}</dt>
            <dd>{created.toString()}</dd>
            <dt>{t('Full Details and Preview')}</dt>
            {/* @TODO: handle external link */}
            <dd><a href={dataHubUrl}>{t(`${title} (opens in web browser)`)}</a></dd>
          </dl>
        </div>
      }
    </div>
  );
}
