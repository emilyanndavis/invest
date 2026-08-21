import { useEffect, useState, type ChangeEvent, type ReactElement } from 'react';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { useTranslation } from 'react-i18next';
import {
  MdClose,
  MdSearchOff,
} from 'react-icons/md';

import type { DataHubSearchResult } from './models';
import { mockSearchResults } from './mockSearchResults';
import DataHubSearchResultCard from './DataHubSearchResultCard';
import DataHubSearchParams from './DataHubSearchParams';
import type { DataHubSearchQuery } from './DataHubSearchParams/models';
import { openLinkInBrowser } from '../../utils';

interface DataHubSearchModalProps {
  show: boolean,
  closeModal: () => {},
  query: DataHubSearchQuery,
  selectSearchResult: (url: string) => {},
}

interface SearchModalView {
  title: string,
  footer?: ReactElement,
}

export default function DataHubSearchModal(props: DataHubSearchModalProps) {
  const {
    show,
    closeModal,
    query,
    selectSearchResult,
  } = props;

  const { t } = useTranslation();

  const [step, setStep] = useState<number>(0);
  const [view, setView] = useState<SearchModalView | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [numSearchResults, setNumSearchResults] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<DataHubSearchResult[]>([]);
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [cardsExpanded, setCardsExpanded] = useState<Map<string, boolean>>(new Map());
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

  const toggleExpandCard = (id: string) => {
    const prevState = cardsExpanded.get(id);
    // console.log(`toggleExpandCard for id ${id} from ${prevState} to ${!prevState}`);
    setCardsExpanded(new Map([...cardsExpanded, [id, !prevState]]));
  };

  const toggleExpandAll = (event: ChangeEvent) => {
    const checkbox = event.target as HTMLInputElement;
    // console.log(`expand all? ${checkbox.checked}`);
    setAllExpanded(checkbox.checked);
  };

  const expandAllCards = () => {
    // console.log('expand all cards');
    setCardsExpanded(new Map(searchResults.map(({id}) => [id, true])));
  };

  const collapseAllCards = () => {
    // console.log('collapse all cards');
    setCardsExpanded(new Map(searchResults.map(({id}) => [id, false])));
  };

  const selectDataset = (url: string) => {
    selectSearchResult(url);
    close();
  };

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
        collapseAllCards();
        // setSearchError(true); // uncomment to test error state
        nextStep();
      }, 200);
      return () => clearTimeout(mockAsyncCall);
    }
  }, [searching]);

  useEffect(() => {
    allExpanded ? expandAllCards() : collapseAllCards();
    // console.log(`allExpanded is now ${allExpanded}`);
  }, [allExpanded]);

  // @TODO: determine AOI state from context
  const aoiExists = true; // set `aoiExists` to `false` to test error state
  const aoiDisplayName = t('Watersheds vector');

  const introView: SearchModalView = {
    title: t('Search the Data Hub'),
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
  };
  const resultsView: SearchModalView = {
    title: t('Search Results'),
  };

  const views: SearchModalView[] = [
    introView,
    searchingView,
    resultsView,
  ];

  return (
    view &&
    <Modal
      show={show}
      onHide={close}
      scrollable
      contentClassName="search-modal"
    >
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
        {
          step === 0 &&
          <DataHubSearchIntroView
            aoiExists={aoiExists}
            aoiDisplayName={aoiDisplayName}
            query={query}
          />
        }
        {
          step === 1 &&
          <DataHubSearchSearchingView />
        }
        {
          step === 2 &&
          <DataHubSearchResultsView
            query={query}
            numSearchResults={numSearchResults}
            searchResults={searchResults}
            toggleExpandCard={toggleExpandCard}
            toggleExpandAll={toggleExpandAll}
            cardsExpanded={cardsExpanded}
            selectDataset={selectDataset}
          />
        }
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

interface IntroViewProps {
  aoiExists: boolean,
  aoiDisplayName: string,
  query: DataHubSearchQuery,
}

function DataHubSearchIntroView(props: IntroViewProps) {
  const { aoiExists, aoiDisplayName, query } = props;
  const { t } = useTranslation();

  return (
      <>
        <p>
          {t(`Search the Natural Capital Alliance Data Hub for datasets you can
            use in InVEST without having to download them first.`)}
        </p>
      {
        aoiExists
        ? <DataHubSearchParams
            tags={query.tags}
            datatype={query.datatype}
            extent={query.extent}
            collection={query.collection}
          />
        : <>
            <div className="search-error">
              <MdSearchOff aria-label={t('Error')} className="error-icon" />
              <span>{t(`Before searching, you must specify a valid ${aoiDisplayName}.`)}</span>
            </div>
          </>
        }
      </>
  );
}

function DataHubSearchSearchingView() {
  const { t } = useTranslation();

  return (
    <>
      <Spinner animation="border" role="status" className="search-spinner">
        <span className="visually-hidden">{t('Searching')}</span>
      </Spinner>
    </>
  );
}

interface ResultsViewProps {
  query: DataHubSearchQuery,
  numSearchResults: number,
  searchResults: DataHubSearchResult[],
  toggleExpandCard: (id: string) => void,
  toggleExpandAll: (event: ChangeEvent) => void,
  cardsExpanded: Map<string, boolean>,
  selectDataset: (url: string) => void,
}

function DataHubSearchResultsView(props: ResultsViewProps) {
  const {
    query, numSearchResults, searchResults, toggleExpandCard,
    toggleExpandAll, cardsExpanded, selectDataset } = props;
  const { t } = useTranslation();

  return (
    <>
      <DataHubSearchParams
        tags={query.tags}
        datatype={query.datatype}
        extent={query.extent}
        collection={query.collection}
      />
      {
        numSearchResults
        ? <>
            <div className="search-results-header">
              <p>{numSearchResults == 1 ? t('1 result found.') : t(`${numSearchResults} results found.`)}</p>
              <Form.Check
                type="switch" // type="switch" controls styling
                role="switch" // role="switch" communicates correct semantics to assistive tech
                id="expand-all"
                label={t('Expand All')}
                onChange={toggleExpandAll}
              />
            </div>
            <div className="search-results">
              {searchResults.map((result =>
                <DataHubSearchResultCard
                  key={result.id}
                  datasetDetails={result}
                  expanded={cardsExpanded.get(result.id) as boolean}
                  onToggleExpanded={() => toggleExpandCard(result.id)}
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
              <a
                href="https://data.naturalcapitalalliance.stanford.edu/"
                className="d-flex"
                onClick={openLinkInBrowser}
              >
                {t(`Natural Capital Alliance Data Hub (opens in web browser)`)}
              </a>
            </p>
          </>
      }
      {/* @TODO: error state */}
    </>
  );
}
