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
document.getElementById("results-container").innerHTML = "";
document.getElementById("no_of_results_shown").innerText = data.length;
const urlParams = new URLSearchParams(window.location.search);
const q = urlParams.get("q") || "";
document.getElementById("search-input").value = q;
document.getElementById("category-filter").value = urlParams.get("skill") || "";
document.getElementById("skill-level-filter").value =
  urlParams.get("skill_level") || "0";
document.getElementById("distance-filter").value =
  Number(urlParams.get("distance")) || 5;
document.getElementById("distance-value").innerText =
  (Number(urlParams.get("distance")) || 5) + " km";
document.getElementById("search-input").focus();

const lang1 = window.location.pathname
  .split("/")
  .filter(Boolean)[0]
  .toLowerCase();

document.querySelectorAll(".language-option").forEach((element) => {
  element.classList.remove("active"); // Remove active from all

  // Check if this option's onclick calls setLanguage with current lang
  const onClickValue = element.getAttribute("onclick");
  if (onClickValue && onClickValue.includes(`'${lang1}'`)) {
    element.classList.add("active"); // Add active to the selected language
  }
});

if (data.length == 0) {
  document.getElementById("results-container").innerHTML =
    "<h2>No results found</h2>";
} else {
  data.forEach((labour) => {
    labour.skills = JSON.parse(labour.skills);
    document.getElementById("results-container").innerHTML += `
  <div class="result-card" onclick="view('${labour.labour_id}')">
              <h4>${labour.name}</h4>
              <p class="status">${
                labour.status == 1
                  ? "<span class='material-symbols-outlined'>check_circle</span> Available"
                  : labour.status == 2
                  ? "span class='material-symbols-outlined'>avg_pace</span> Away"
                  : "NA"
              }</p>
              <div class="location">
                <span class="material-symbols-outlined"> location_on </span>
                <p>${labour.area}, ${labour.city}</p>
              </div>
              <h6>Skills</h6>
              <div class="skill-container">${Object.entries(labour.skills)
                .map(([key, value]) => `<p class="skill">${key} - ${value}</p>`)
                .join("")}

              </div>
              <p>Languages Spoken: ${labour.languages_spoken}</p>
              <div class="distance">
                <span class="material-symbols-outlined"> near_me </span>
                <p>${labour.distance_km} km away</p>
              </div>
              

              <div class="action-btns" style="flex: 1">
                <button onclick="call('${labour.phone1}')">
                  <span
                    class="material-symbols-outlined"
                    style="margin-right: 10px"
                  >
                    call
                  </span>
                  Call
                </button>
                <button onclick="copy('${labour.phone1}')">
                  <span class="material-symbols-outlined"> content_copy </span>
                </button>
              </div>
            </div>`;
  });
}

function call(phone_number) {
  window.open("tel:" + phone_number);
}
function copy(phone_number) {
  navigator.clipboard.writeText(phone_number);
}
document
  .getElementById("search-input")
  .addEventListener("keypress", (event) => {
    if (event.code == "Enter") {
      search();
    }
  });

function search() {
  const query = document.getElementById("search-input").value;

  // Optionally, get lang and page from URL path (fallback to defaults)
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const lang = pathParts[0] || "en"; // Or set statically
  const page = 1; // Reset to first page on new search

  // Gather filter values (add or remove fields as per HTML form)
  const skill = document.getElementById("skill-filter")?.value || "";
  const skillLevel = document.getElementById("skill-level-filter")?.value || "";
  const city = document.getElementById("city-filter")?.value || "";
  const rating = document.getElementById("rating-filter")?.value || "";
  const distance = document.getElementById("distance-filter")?.value || "";
  const category = document.getElementById("category-filter")?.value || "";

  // Build query parameters
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (skill) params.append("skill", skill);
  if (skillLevel) params.append("skill_level", skillLevel);
  if (city) params.append("city", city);
  if (category) params.append("category", category);
  if (rating) params.append("rating", rating);
  if (distance) params.append("distance", distance);

  window.location.href = `${
    window.location.origin
  }/${lang}/${page}?${params.toString()}`;
}

function applyFilters() {
  const category = document.getElementById("category-filter").value;
  const skillLevel = document.getElementById("skill-level-filter").value;
  const distance = document.getElementById("distance-filter").value;
  const urlParams = new URLSearchParams(window.location.search);

  // Preserve existing 'q' parameter if present
  const query = urlParams.get("q") || "";

  // Update parameters
  if (category) urlParams.set("skill", category);
  else urlParams.delete("skill");

  if (skillLevel) urlParams.set("skill_level", skillLevel);
  else urlParams.delete("skill_level");

  if (distance) urlParams.set("distance", distance);
  else urlParams.delete("distance");

  // Get current path parts
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const lang = pathParts[0] || "en"; // default to 'en' if not set
  const page = pathParts[1] || "1"; // default to '1' if not set

  // Build new URL
  const newUrl = `/${lang}/${page}?${urlParams.toString()}`;
  window.location.href = newUrl;
}
function setLanguage(lang) {
  // Get current page number from URL, default to 1 if not present
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const page = pathParts[1] || "1";

  // Preserve existing query parameters
  const search = window.location.search;

  // Redirect to the same page with new language code
  window.location.href = `/${lang}/${page}${search}`;
  closeLanguageSelector();
  document.getElementById("preloader-window").style.display = "flex";
}
const translations = {
  en: {
    heroHeading: "Find Skilled Labours Near You",
    heroSubHeading:
      "Connect with verified local workers for all your service needs",
    filterHeading: "Filter",
    categoryLabel: "Category",
    skillLevelLabel: "Skill level",
    distanceLabel: "Distance",
    applyFiltersBtn: "Apply Filters",
    resultsHeading: "Search Results",
  },
  hi: {
    heroHeading: "अपने नजदीकी कुशल मजदूरों को खोजें",
    heroSubHeading:
      "सभी सेवा आवश्यकताओं के लिए सत्यापित स्थानीय कार्यकर्ताओं से जुड़ें",
    filterHeading: "फ़िल्टर करें",
    categoryLabel: "श्रेणी",
    skillLevelLabel: "कौशल स्तर",
    distanceLabel: "दूरी",
    applyFiltersBtn: "फ़िल्टर लागू करें",
    resultsHeading: "खोज परिणाम",
  },
  bn: {
    heroHeading: "আপনার নিকটস্থ দক্ষ শ্রমিকদের খুঁজুন",
    heroSubHeading:
      "আপনার সমস্ত সেবার প্রয়োজনে যাচাইকৃত স্থানীয় কর্মীদের সাথে সংযুক্ত হোন",
    filterHeading: "ফিল্টার",
    categoryLabel: "বিভাগ",
    skillLevelLabel: "দক্ষতার স্তর",
    distanceLabel: "দূরত্ব",
    applyFiltersBtn: "ফিল্টার প্রয়োগ করুন",
    resultsHeading: "অনুসন্ধান ফলাফল",
  },
  te: {
    heroHeading: "మీ సమీపంలోని నైపుణ్యమైన కార్మికులను కనుగొనండి",
    heroSubHeading:
      "మీ సేవా అవసరాల కోసం ధృవీకృత స్థానిక కార్మికులతో చేర్చుకోండి",
    filterHeading: "ఫిల్టర్",
    categoryLabel: "వర్గం",
    skillLevelLabel: "నైపుణ్య స్థాయి",
    distanceLabel: "దూరం",
    applyFiltersBtn: "ఫిల్టర్ వర్తించు",
    resultsHeading: "సోషల్ ఫలితాలు",
  },
  ta: {
    heroHeading: "உங்கள் அருகிலுள்ள திறமையான தொழிலாளர்களை கண்டுபிடிக்கவும்",
    heroSubHeading:
      "உங்கள் சேவை தேவைகளுக்கு சரிபார்க்கப்பட்ட உள்ளூரான தொழிலாளர்களுடன் இணைவர்",
    filterHeading: "வடியாக்கி",
    categoryLabel: "வகை",
    skillLevelLabel: "திறன் நிலை",
    distanceLabel: "தொலைவு",
    applyFiltersBtn: "வடிகட்டை பொருத்து",
    resultsHeading: "தேடல் முடிவுகள்",
  },
  ur: {
    heroHeading: "اپنے قریب ماہر مزدوروں کو تلاش کریں",
    heroSubHeading:
      "اپنی تمام سروس کی ضروریات کے لئے تصدیق شدہ مقامی کارکنوں سے جڑیں",
    filterHeading: "فلٹر",
    categoryLabel: "زمرہ",
    skillLevelLabel: "مہارت کی سطح",
    distanceLabel: "فاصلہ",
    applyFiltersBtn: "فلٹر لگائیں",
    resultsHeading: "تلاش کے نتائج",
  },
  gu: {
    heroHeading: "તમારા નજીકના કુશળ મજૂરો શોધો",
    heroSubHeading:
      "તમારી તમામ સેવા જરૂરિયાતો માટે પ્રમાણિત સ્થાનિક કામદારો સાથે જોડાઓ",
    filterHeading: "ફિલટર",
    categoryLabel: "શ્રેણી",
    skillLevelLabel: "કૌશલ્ય સ્તર",
    distanceLabel: "દૂરી",
    applyFiltersBtn: "ફિલ્ટર લાગુ કરો",
    resultsHeading: "શોધ પરિણામો",
  },
  kn: {
    heroHeading: "ನಿಮ್ಮ ಹತ್ತಿರದ ಕುಶಲ ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ",
    heroSubHeading:
      "ನಿಮ್ಮ ಎಲ್ಲಾ ಸೇವಾ ಅಗತ್ಯಗಳಿಗೆ ಪರಿಶೀಲಿತ ಸ್ಥಳೀಯ ಕಾರ್ಮಿಕರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ",
    filterHeading: "ಫಿಲ್ಟರ್",
    categoryLabel: "ವರ್ಗ",
    skillLevelLabel: "ದಕ್ಷತೆ ಮಟ್ಟ",
    distanceLabel: "ದೂರ",
    applyFiltersBtn: "ಫಿಲ்டர் ಅನ್ವಯಿಸಿ",
    resultsHeading: "ಹುಡುಕಿ ಫಲಿತಾಂಶಗಳು",
  },
  pa: {
    heroHeading: "ਆਪਣੇ ਨੇੜੇ ਕਾਬਲ ਮਜ਼ਦੂਰ ਲੱਭੋ",
    heroSubHeading:
      "ਆਪਣੀਆਂ ਸਾਰੀਆਂ ਸੇਵਾ ਲੋੜਾਂ ਲਈ ਪ੍ਰਮਾਣਿਤ ਸਥਾਨਕ ਕਰਮਚਾਰੀਆਂ ਨਾਲ ਜੁੜੋ",
    filterHeading: "ਫਿਲਟਰ",
    categoryLabel: "ਸ਼੍ਰੇਣੀ",
    skillLevelLabel: "ਕੋਸ਼ਲ ਸਤਰ",
    distanceLabel: "ਫਾਸਲਾ",
    applyFiltersBtn: "ਫਿਲਟਰ ਲਗਾਓ",
    resultsHeading: "ਖੋਜ ਨਤੀਜੇ",
  },
  mr: {
    heroHeading: "तुमच्या जवळील कुशल कामगार शोधा",
    heroSubHeading:
      "तुमच्या सर्व सेवा गरजांसाठी प्रमाणित स्थानिक कामगारांशी संपर्क साधा",
    filterHeading: "फिल्टर",
    categoryLabel: "श्रेणी",
    skillLevelLabel: "कौशल्य पातळी",
    distanceLabel: "अंतर",
    applyFiltersBtn: "फिल्टर लागू करा",
    resultsHeading: "शोध परिणाम",
  },
};

document.getElementById("heroHeading").innerText =
  translations[lang1].heroHeading;
document.getElementById("heroSubHeading").innerText =
  translations[lang1].heroSubHeading;
document.getElementById("filterHeading").innerText =
  translations[lang1].filterHeading;
document.getElementById("categoryLabel").innerText =
  translations[lang1].categoryLabel;
document.getElementById("skillLevelLabel").innerText =
  translations[lang1].skillLevelLabel;
document.getElementById("distanceLabel").innerText =
  translations[lang1].distanceLabel;
document.getElementById("apply-filters-button").innerText =
  translations[lang1].applyFiltersBtn;

document.getElementById("results-heading").innerText =
  translations[lang1].resultsHeading;