import { wedding } from '../data/wedding';

type Location = typeof wedding.ceremony | typeof wedding.banquet;

function LocationCard({ location }: { location: Location }) {
  const italyPhoto = 'italyPhoto' in location ? location.italyPhoto : undefined;

  return (
    <article className="location-card">
      <figure className={`location-card__photo${italyPhoto ? ' location-card__photo--has-italy' : ''}`}>
        <img
          className="location-card__image location-card__image--default"
          src={location.photo}
          alt={location.photoAlt}
          loading="lazy"
          onError={(event) => {
            const image = event.currentTarget;

            if (image.dataset.fallbackApplied === 'true') {
              return;
            }

            image.dataset.fallbackApplied = 'true';
            image.src = location.photoFallback;
          }}
        />
        {italyPhoto ? (
          <img
            className="location-card__image location-card__image--italy"
            src={italyPhoto}
            alt={location.photoAlt}
            loading="lazy"
            onError={(event) => {
              const image = event.currentTarget;

              if (image.dataset.fallbackApplied === 'true') {
                return;
              }

              image.dataset.fallbackApplied = 'true';
              image.src = location.photoFallback;
            }}
          />
        ) : null}
        <figcaption>{location.time}</figcaption>
      </figure>
      <div className="location-card__body">
        <p className="location-card__time">{location.time}</p>
        <h3>{location.place}</h3>
        <p className="location-card__address">{location.address}</p>
      </div>
      <div className="map-actions" aria-label={`Карты для ${location.place}`}>
        <a className="map-actions__link" href={location.maps.yandex} target="_blank" rel="noreferrer">
          Яндекс Карты
        </a>
        <a className="map-actions__link" href={location.maps.twoGis} target="_blank" rel="noreferrer">
          2ГИС
        </a>
        <a className="map-actions__link" href={location.maps.google} target="_blank" rel="noreferrer">
          Google Maps
        </a>
      </div>
    </article>
  );
}

export function Locations() {
  return (
    <section className="content-section section-reveal" aria-labelledby="locations-title">
      <div className="section-kicker">Локации</div>
      <h2 id="locations-title">Где встречаемся</h2>
      <div className="locations-grid">
        <p>При желании и возможности будем рады видеть вас на нашей свадебной регистрации</p>
        <LocationCard location={wedding.ceremony} />
        <LocationCard location={wedding.banquet} />
      </div>
    </section>
  );
}
