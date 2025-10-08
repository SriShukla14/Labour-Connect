function showStarRating(element) {
  const stars = element.parentElement.querySelectorAll('span');
  stars.forEach((star, index) => {
    if (index <= Array.from(stars).indexOf(element)) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
  element.parentElement.setAttribute('data-rating', Array.from(stars).indexOf(element) + 1);
}
