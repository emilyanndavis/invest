import { useEffect, useState, type ReactElement } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { useTranslation } from 'react-i18next';
import {
  MdClose,
  MdErrorOutline,
} from 'react-icons/md';

import type { SearchResult } from './models';
import { mockSearchResults } from './mockSearchResults';
import SearchResultCard from './SearchResultCard';

interface SearchModalProps {
  show: boolean,
  closeModal: () => {},
}

interface SearchModalView {
  title: string,
  body: ReactElement,
  footer?: ReactElement,
}

export default function SearchModal(props: SearchModalProps) {
  const {
    show,
    closeModal,
  } = props;

  const { t } = useTranslation();

  const [step, setStep] = useState<number>(0);
  const [view, setView] = useState<SearchModalView | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [numSearchResults, setNumSearchResults] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<boolean>(false);

  const nextStep = () => {
    // console.log(`nextStep called. current step: ${step}`);
    setStep(step + 1);
  };

  const search = () => {
    // console.log('searching...');
    nextStep();
    setSearching(true);
  };

  const goToAoiField = () => {
    close();
    // @TODO: move focus to AOI field in setup form
  };

  const selectDataset = (url: string) => {
    close();
    // @TODO: populate input field with DH URL
  }

  const close = () => {
    setStep(0); // Save state or reset?
    setSearching(false);
    closeModal();
  };

  useEffect(() => {
    // console.log(`step changed. new step: ${step}`);
    if (views[step]) {
      setView(views[step]);
    }
  }, [step]);

  useEffect(() => {
    if (searching) {
      // @TODO: initiate search, then call nextStep on response
      const mockAsyncCall = setTimeout(() => {
        setNumSearchResults(mockSearchResults.length);
        setSearchResults(mockSearchResults);
        // setSearchError(true); // uncomment to test error state
        nextStep();
      }, 200);
      return () => clearTimeout(mockAsyncCall);
    }
  }, [searching]);

  // @TODO: pass these in via props
  const inputType = t('digital elevation model (DEM)');
  const aoiExists = true;
  const aoiDisplayName = t('Watersheds vector');

  const introView: SearchModalView = {
    title: t('Search the Data Hub'),
    body:
      <>
        <p>
          {t(`Search the Natural Capital Alliance Data Hub for datasets you can
            use in InVEST without having to download them first.`)}
        </p>
      {
        aoiExists
        ? <dl>
            <dt>{t('Type of input')}</dt>
            <dd>{inputType}</dd>
            {/* @TODO: add other query params */}
            {/* @TODO: extract into a reusable snippet (or component) for rendering in results view as well */}
          </dl>
        : <div className="search-error">
            <MdErrorOutline aria-label={t('Error')} className="error-icon" />
            <span>{t(`Before searching, you must specify a valid ${aoiDisplayName}.`)}</span>
          </div>
        }
      </>,
    footer:
      aoiExists
      ? <Button onClick={search}>{t('Search')}</Button>
      : <>
          <Button variant="outline-primary" onClick={close}>{t('OK')}</Button>
          <Button onClick={goToAoiField}>{t(`Go to ${aoiDisplayName}`)}</Button>
        </>
  };
  const searchingView: SearchModalView = {
    title: t('Searching…'),
    body:
      <>
        <Spinner animation="border" role="status" className="search-spinner">
          <span className="visually-hidden">{t('Searching')}</span>
        </Spinner>
      </>,
  };
  const resultsView: SearchModalView = {
    title: t('Search Results'),
    body:
      // @TODO: include query params
      numSearchResults
      ? <>
          <p>{numSearchResults == 1 ? t('1 result found.') : t(`${numSearchResults} results found.`)}</p>
          {/* @TODO: 'expand all' toggle */}
          <div className="search-results">
            {searchResults.map((result =>
              <SearchResultCard
                key={result.id}
                datasetDetails={result}
                onSelect={selectDataset}
              />
            ))}
          </div>
        </>
      : <>
          <p>{t('No results found.')}</p>
          <p>
            {t(`We are actively working on adding more datasets to the Data Hub
            to meet the needs of InVEST users. Please check back later as the
            collection grows!`)}
          </p>
          <p>
            {t(`In the meantime, if you'd like to explore the Data Hub on your
              own, you can visit it on the web:`)}
            {/* @TODO: handle external link */}
            <a
              href="https://data.naturalcapitalalliance.stanford.edu/"
              className="d-flex"
            >
              {t(`Natural Capital Alliance Data Hub (opens in new browser window)`)}
            </a>
          </p>
        </>,
      // @TODO: error state (including query params)
  };

  const views: SearchModalView[] = [
    introView,
    searchingView,
    resultsView,
  ];

  return (
    view &&
    <Modal show={show} onHide={close} contentClassName="search-modal">
      <Modal.Header>
        <Modal.Title as="h1" className="h4">{view.title}</Modal.Title>
        <Button
          variant="secondary-outline"
          onClick={close}
          aria-label={t('Close modal')}
        >
          <MdClose />
        </Button>
      </Modal.Header>
      <Modal.Body>
        {view.body}
      </Modal.Body>
      {
        view.footer &&
        <Modal.Footer>
          {view.footer}
        </Modal.Footer>
      }
    </Modal>
  );
}
