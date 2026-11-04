import PropTypes from "prop-types";
const TechStackIcon = ({ TechStackIcon, Language }) => (
  <div className="flex h-full items-center gap-3 px-4 py-4 sm:px-5 sm:py-5">
    <img
      src={`/${TechStackIcon}`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className="h-7 w-7 shrink-0 object-contain"
    />
    <span className="text-[15px] leading-tight text-kar">{Language}</span>
  </div>
);

export default TechStackIcon;

TechStackIcon.propTypes = {
  TechStackIcon: PropTypes.string.isRequired,
  Language: PropTypes.string.isRequired,
};
