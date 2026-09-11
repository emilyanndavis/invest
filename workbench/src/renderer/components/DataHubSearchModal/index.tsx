import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';

import {
  transformDHALSearchResult,
  type DataHubSearchResult,
  type DHALDataset
} from './models';
import {
  DHALSearchParams,
  type DataHubSearchQuery
} from './DataHubSearchParams/models';
import {
  DataHubSearchIntroBody,
  DataHubSearchIntroFooter,
  DataHubSearchResultsBody,
  DataHubSearchResultsFooter,
  DataHubSearchSearchingBody
} from './DataHubSearchModalViews';

interface DataHubSearchModalProps {
  show: boolean,
  closeModal: () => {},
  query: DataHubSearchQuery,
  aoiInputName: string,
  aoiIsValid: boolean,
  selectSearchResult: (url: string, collections: string[]) => {},
  requestFocusOnAoiInput: () => {},
}

const DHAL_BASE_URL = 'https://data.naturalcapitalalliance.stanford.edu/dhal/search_dataset/';

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
    // Modal automatically receives focus when it first opens.
    // This effect re-focuses the modal when its content changes,
    // to better support keyboard operability & screen reader navigation.
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
      const params = new DHALSearchParams(query);
      fetch(`${DHAL_BASE_URL}?${params}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
        })
        .then(({ count, datasets }) => {
          setNumSearchResults(count);
          setSearchResults(datasets.map((d: DHALDataset) => transformDHALSearchResult(d)));
          collapseAllCards();
          setSearching(false);
        })
        .catch((error) => {
          setSearchError(true);
          console.error((error as Error).message);
        })
        .finally(() => nextStep())
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
