import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';
import {
  TbMapSearch,
  TbZoomCancel,
  TbZoomExclamation,
} from 'react-icons/tb';

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
  aoiInputName: string,
  aoiIsValid: boolean,
  selectSearchResult: (url: string, collections: string[]) => {},
  requestFocusOnAoiInput: () => {},
}

const INTRO_STEP = 0;
const SEARCHING_STEP = 1;
const RESULTS_STEP = 2;

export default function DataHubSearchModal(props: DataHubSearchModalProps) {
  const {
    show,
    closeModal,
    query,
    aoiInputName,
    aoiIsValid,
    selectSearchResult,
    requestFocusOnAoiInput,
  } = props;

  const { t } = useTranslation();

  const [step, setStep] = useState<number>(0);
  const [searching, setSearching] = useState<boolean>(false);
  const [numSearchResults, setNumSearchResults] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<DataHubSearchResult[]>([]);
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [cardsExpanded, setCardsExpanded] = useState<Map<string, boolean>>(new Map());
  const [searchError, setSearchError] = useState<boolean>(false);

  const autoFocusRef: RefObject<any> = useRef(null);

  const nextStep = () => {
    setStep(step + 1);
  };

  useEffect(() => {
    // Modal automatically receives focused upon opening.
    // This re-focuses the modal when its content changes.
    autoFocusRef.current?.dialog?.focus();
  }, [step]);

  const search = () => {
    setStep(SEARCHING_STEP);
    setSearchError(false);
    setSearching(true);
  };

  const goToAoiInput = () => {
    requestFocusOnAoiInput();
    close();
  };

  const toggleExpandCard = (id: string) => {
    const prevState = cardsExpanded.get(id);
    setCardsExpanded(new Map([...cardsExpanded, [id, !prevState]]));
  };

  const toggleExpandAll = (event: ChangeEvent) => {
    const checkbox = event.target as HTMLInputElement;
    setAllExpanded(checkbox.checked);
  };

  const expandAllCards = () => {
    setCardsExpanded(new Map(searchResults.map(({id}) => [id, true])));
  };

  const collapseAllCards = () => {
    setCardsExpanded(new Map(searchResults.map(({id}) => [id, false])));
  };

  const selectDataset = (url: string, collections: string[]) => {
    selectSearchResult(url, collections);
    close();
  };

  const close = () => {
    // Setting step to 0 "resets" modal state each time it closes.
    // @TODO: ¿consider preserving step number to prevent repeated user interactions,
    // perhaps resetting step number only if/when query params have changed?
    setStep(0);
    setSearching(false);
    closeModal();
  };

  useEffect(() => {
    if (searching) {
      // @TODO: initiate search, then call nextStep on response
      const mockAsyncCall = setTimeout(() => {
        setNumSearchResults(mockSearchResults.length);
        // setNumSearchResults(0); // uncomment to test "no results" state
        // setSearchResults(mockSearchResults);
        setSearchResults(mockSearchResults.filter(result => query.collections.length ? (result.collections[0] === query.collections[0]) : result));  // mock collection filtering
        collapseAllCards();
        // setSearchError(true); // uncomment to test error state
        setSearching(false);
        nextStep();
      }, 350);
      return () => clearTimeout(mockAsyncCall);
    }
  }, [searching]);

  useEffect(() => {
    allExpanded ? expandAllCards() : collapseAllCards();
  }, [allExpanded]);

  const introTitle = t('Search the Data Hub');
  const searchingTitle = t('Searching…');
  const resultsTitle = t('Search Results');
  const titles = [
    introTitle,
    searchingTitle,
    resultsTitle,
  ];

  return (
    <Modal
      show={show}
      onHide={close}
      scrollable
      contentClassName="search-modal"
      ref={autoFocusRef}
    >
      <Modal.Header>
        <Modal.Title as="h1" className="h4">{titles[step]}</Modal.Title>
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
          step === INTRO_STEP &&
          <DataHubSearchIntroBody
            aoiInputName={aoiInputName}
            aoiIsValid={aoiIsValid}
            query={query}
          />
        }
        {
          step === SEARCHING_STEP &&
          <DataHubSearchSearchingBody />
        }
        {
          step === RESULTS_STEP &&
          <DataHubSearchResultsBody
            query={query}
            searchError={searchError}
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
        step === INTRO_STEP &&
        <Modal.Footer>
          <DataHubSearchIntroFooter
            aoiIsValid={aoiIsValid}
            aoiInputName={aoiInputName}
            search={search}
            close={close}
            goToAoiInput={goToAoiInput}
          />
        </Modal.Footer>
      }
      {
        step === RESULTS_STEP && searchError &&
        <Modal.Footer>
          <DataHubSearchResultsFooter
            searchError={searchError}
            search={search}
          />
        </Modal.Footer>
      }
    </Modal>
  );
}

interface IntroBodyProps {
  aoiInputName: string,
  aoiIsValid: boolean,
  query: DataHubSearchQuery,
}

function DataHubSearchIntroBody(props: IntroBodyProps) {
  const { aoiIsValid, aoiInputName, query } = props;
  const { t } = useTranslation();

  return (
      <>
        <p>
          {t(`Search the Natural Capital Alliance Data Hub for datasets you can
            use in InVEST without having to download them first.`)}
        </p>
        {/* @TODO: add loading spinner if/when awaiting AOI validation status, AOI extent, and/or collection string. */}
      {
        aoiIsValid
        ? <DataHubSearchParams
            tags={query.tags}
            datatype={query.datatype}
            extent={query.extent}
            collections={query.collections}
          />
        : <>
            <div className="search-error">
              <TbZoomCancel aria-label={t('Error')} className="error-icon" />
              <span>
                {t(`Before searching, you must specify a valid path for the following input:`)}
                <strong className="aoi-input-name">{aoiInputName}</strong>
              </span>
            </div>
          </>
        }
      </>
  );
}

function DataHubSearchSearchingBody() {
  const { t } = useTranslation();

  return (
    <>
      <Spinner animation="border" role="status" className="search-spinner"></Spinner>
    </>
  );
}

interface ResultsBodyProps {
  query: DataHubSearchQuery,
  searchError: boolean,
  numSearchResults: number,
  searchResults: DataHubSearchResult[],
  toggleExpandCard: (id: string) => void,
  toggleExpandAll: (event: ChangeEvent) => void,
  cardsExpanded: Map<string, boolean>,
  selectDataset: (url: string, collections: string[]) => void,
}

function DataHubSearchResultsBody(props: ResultsBodyProps) {
  const {
    query, searchError, numSearchResults, searchResults,
    toggleExpandCard, toggleExpandAll, cardsExpanded, selectDataset } = props;
  const { t } = useTranslation();

  return (
    <>
      <DataHubSearchParams
        tags={query.tags}
        datatype={query.datatype}
        extent={query.extent}
        collections={query.collections}
      />
      {
        searchError
        ? <>
            <div className="search-error">
              <TbZoomExclamation aria-label={t('Error')} className="error-icon" />
              <span>
                {t(`An error occurred. Please check your internet connection, then try again.
                  If the problem persists, consider reporting it on the NatCap Community Forum.`)}
              </span>
            </div>
            <a
              href="https://community.naturalcapitalalliance.org/"
              className="d-flex justify-content-center"
              onClick={openLinkInBrowser}
            >
              {t('Natural Capital Alliance Community Forum (opens in web browser)')}
            </a>
          </>
        : (
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
                      expanded={cardsExpanded.get(result.id) ? true : false}
                      onToggleExpanded={() => toggleExpandCard(result.id)}
                      onSelect={selectDataset}
                    />
                  ))}
                </div>
              </>
            : <>
                <p>{t('No results found.')}</p>
                <TbMapSearch className="no-results-icon" aria-hidden="true" />
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
          )
      }
    </>
  );
}

function DataHubSearchIntroFooter(
  props: {
    aoiIsValid: boolean,
    aoiInputName: string,
    search: () => void,
    close: () => void,
    goToAoiInput: () => void,
  }
) {
  const { aoiIsValid, aoiInputName, search, close, goToAoiInput } = props;
  const { t } = useTranslation();

  return (
      aoiIsValid
      ? <Button onClick={search}>{t('Search')}</Button>
      : <>
          <Button variant="outline-primary" onClick={close}>{t('OK')}</Button>
          <Button onClick={goToAoiInput}>{t(`Go to ${aoiInputName} form field`)}</Button>
        </>
  );
}

function DataHubSearchResultsFooter(
  props: {searchError: boolean, search: () => void}
) {
  const { searchError, search } = props;
  const { t } = useTranslation();

  return (
      searchError &&
      <>
        <Button onClick={search}>{t('Search again')}</Button>
      </>
  );
}
