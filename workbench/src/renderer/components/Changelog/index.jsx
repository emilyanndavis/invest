import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { MdClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

import pkg from '../../../../package.json';

export default function Changelog(props) {
    const { t } = useTranslation();
    const [htmlContent, setHtmlContent] = useState('');

    // Load HTML from external file (which is generated by Python build process).
    useEffect(() => {
        fetch('changelog.html')
        .then(response => response.text())
        .then(htmlString => {
            // Find the section whose heading explicitly matches the current version.
            const versionStr = pkg.version;
            const escapedVersionStr = versionStr.split('.').join('\\.');
            const sectionRegex = new RegExp(
                `<section.*?>[\\s]*?<h1>${escapedVersionStr}\\b[\\s\\S]*?</h1>[\\s\\S]*?</section>`
            );
            const sectionMatches = htmlString.match(sectionRegex);
            if (sectionMatches && sectionMatches.length) {
                let latestVersionSection = sectionMatches[0];
                const linkRegex = /<a\shref/g;
                // Ensure all links open in a new window and are styled with a relevant icon.
                latestVersionSection = latestVersionSection.replaceAll(
                    linkRegex,
                    '<a target="_blank" class="link-external" href'
                );
                setHtmlContent({
                    __html: latestVersionSection
                });
            }
        });
    }, []);

    return (
        <Modal
            show={props.show && htmlContent !== ''}
            onHide={props.close}
            size="lg"
        >
            <Modal.Header>
                <Modal.Title>{t('New in this version')}</Modal.Title>
                <Button
                    variant="secondary-outline"
                    onClick={props.close}
                    className="float-right"
                    aria-label="Close modal"
                >
                    <MdClose />
                </Button>
            </Modal.Header>
            {/* Setting inner HTML in this way is OK because
            the HTML content is controlled by our build process
            and not, for example, sourced from user input. */}
            <Modal.Body
                dangerouslySetInnerHTML={htmlContent}
            >
            </Modal.Body>
        </Modal>
    );
}

Changelog.propTypes = {
    show: PropTypes.bool.isRequired,
    close: PropTypes.func.isRequired,
};
