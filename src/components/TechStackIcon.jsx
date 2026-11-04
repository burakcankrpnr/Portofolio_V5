import PropTypes from "prop-types";
const TechStackIcon = ({ TechStackIcon, Language }) => (
  <div className="flex h-full items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-5 sm:py-5">
    <img
      src={`/${TechStackIcon}`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7"
    />
    <span className="text-sm leading-tight text-kar sm:text-[15px]">{Language}</span>
  </div>
);

export default TechStackIcon;

TechStackIcon.propTypes = {
  TechStackIcon: PropTypes.string.isRequired,
  Language: PropTypes.string.isRequired,
};
