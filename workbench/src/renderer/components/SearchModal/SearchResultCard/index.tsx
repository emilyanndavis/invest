import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useTranslation } from 'react-i18next';

import type { SearchResult } from '../models';

interface SearchResultCardProps {
  datasetDetails: SearchResult,
  onSelect: (url: string) => void,
}

export default function SearchResultCard(props: SearchResultCardProps) {
  const {
    datasetDetails, onSelect
  } = props;

  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);

  const {
    id, title, description, tags, places, license,
    author, lastUpdated, created, dataHubUrl
  } = datasetDetails;

  const descriptionPreview = description.slice(0, 430) + '…';
  const shortDescriptionPreview = description.slice(0, 170) + '…';

  return (
    <div className="search-result">
      <div className="search-result-header">
        <h2 className="h5 m-0" id={`${id}-title`}>{title}</h2>
        <div className="search-result-controls">
          <Form.Check
            type="switch"
            id={`${id}-toggle`}
            label={t('More Details')}
            aria-describedby={`${id}-title`}
            checked={expanded}
            onChange={() => setExpanded(!expanded)}
          />
          <Button
            onClick={() => onSelect(dataHubUrl)}
            aria-describedby={`${id}-title`}
          >
            {t('Select')}
          </Button>
        </div>
      </div>
      <p className="search-result-description">
        {expanded ? descriptionPreview : shortDescriptionPreview}
      </p>
      <dl>
        <dt>{t('Tags')}</dt>
        <dd>{tags.join(', ')}</dd>
        <dt>{t('Places')}</dt>
        <dd>{places.join(', ')}</dd>
        {
          expanded
          && <>
              <dt>{t('License')}</dt>
              <dd>{license}</dd>
              <dt>{t('Author')}</dt>
              <dd>{author}</dd>
              <dt>{t('Last Updated')}</dt>
              <dd>{lastUpdated.toString()}</dd>
              <dt>{t('Created')}</dt>
              <dd>{created.toString()}</dd>
              <dt>{t('Full Details and Preview')}</dt>
              <dd><a href={dataHubUrl}>{t(`${title} (opens in new browser window)`)}</a></dd>
            </>
        }
      </dl>
    </div>
  );
}
