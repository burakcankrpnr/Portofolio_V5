import PropTypes from "prop-types";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import WebsitePreview from "./WebsitePreview";
import { hostOf } from "../lib/preview";

const MAX_LENGTH = 180;

const CardProject = ({
  Img,
  Title,
  Description,
  Link: ProjectLink,
  Company,
  CompanyLink,
  AppStoreLink,
  GooglePlayLink,
  AppStoreBadge,
  GooglePlayBadge,
  featured = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = Description.length > MAX_LENGTH;
  const displayText =
    isExpanded || !shouldTruncate
      ? Description
      : `${Description.substring(0, MAX_LENGTH).trimEnd()}…`;

  return (
    <article
      className={`group flex h-full flex-col rounded-[28px] border border-cizgi bg-murekkep p-3 transition-colors duration-300 hover:border-sis/40 sm:p-4 ${
        featured ? "lg:grid lg:grid-cols-12 lg:gap-8 lg:p-5" : ""
      }`}
    >
      <div
        className={`relative shrink-0 overflow-hidden rounded-[18px] border border-cizgi ${
          featured ? "aspect-[16/10] lg:col-span-8 lg:aspect-auto lg:min-h-[460px]" : "aspect-[16/10]"
        }`}
      >
        {ProjectLink ? (
          <WebsitePreview url={ProjectLink} title={Title} fallbackImg={Img} />
        ) : (
          <img src={Img} alt={Title} className="h-full w-full object-cover" />
        )}
      </div>

      <div
        className={`flex flex-1 flex-col px-2 pb-2 pt-5 sm:px-3 ${
          featured ? "lg:col-span-4 lg:px-0 lg:py-4 lg:pr-3" : ""
        }`}
      >
        <h3
          className={`display font-semibold leading-tight text-kar ${
            featured ? "text-3xl md:text-[2.75rem]" : "text-2xl md:text-[1.75rem]"
          }`}
        >
          {Title}
        </h3>
        {Company && (
          <p className="mt-1.5 text-[15px] text-sis">
            {CompanyLink ? (
              <a href={CompanyLink} target="_blank" rel="noopener noreferrer" className="link-underline">
                {Company}
              </a>
            ) : (
              Company
            )}{" "}
            bünyesinde
          </p>
        )}

        <p className="mt-4 text-[15px] leading-relaxed text-sis/90">{displayText}</p>
        {shouldTruncate && (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
            className="mt-2 self-start text-sm font-medium text-lila transition-colors hover:text-kayisi"
          >
            {isExpanded ? "Daha az göster" : "Devamını oku"}
          </button>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
          {ProjectLink && (
            <a
              href={ProjectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-kar transition-colors hover:text-kayisi"
            >
              {hostOf(ProjectLink)}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          {(AppStoreLink || GooglePlayLink) && (
            <div className="flex items-center gap-3">
              {AppStoreLink && (
                <a href={AppStoreLink} target="_blank" rel="noopener noreferrer" aria-label={`${Title} App Store`}>
                  <img src={AppStoreBadge} alt="App Store'dan indir" className="h-9 w-auto" />
                </a>
              )}
              {GooglePlayLink && (
                <a href={GooglePlayLink} target="_blank" rel="noopener noreferrer" aria-label={`${Title} Google Play`}>
                  <img src={GooglePlayBadge} alt="Google Play'den indir" className="h-9 w-auto" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default CardProject;

CardProject.propTypes = {
  Img: PropTypes.string,
  Title: PropTypes.string.isRequired,
  Description: PropTypes.string.isRequired,
  Link: PropTypes.string,
  Company: PropTypes.string,
  CompanyLink: PropTypes.string,
  AppStoreLink: PropTypes.string,
  GooglePlayLink: PropTypes.string,
  AppStoreBadge: PropTypes.string,
  GooglePlayBadge: PropTypes.string,
  featured: PropTypes.bool,
};
