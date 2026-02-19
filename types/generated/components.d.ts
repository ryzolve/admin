import type { Schema, Attribute } from '@strapi/strapi';

export interface AboutAbout extends Schema.Component {
  collectionName: 'components_about_abouts';
  info: {
    displayName: 'About';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
    aboutList: Attribute.Component<'list.group-of-items', true>;
  };
}

export interface ArrayStandardarray extends Schema.Component {
  collectionName: 'components_array_standardarrays';
  info: {
    displayName: 'standardarray';
  };
  attributes: {
    LessonsList: Attribute.String;
  };
}

export interface CardOurSolutions extends Schema.Component {
  collectionName: 'components_card_our_solutions';
  info: {
    displayName: 'our solutions';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
    personalAgency: Attribute.Component<'list.group-of-items', true>;
  };
}

export interface CertificateNamesCertificate extends Schema.Component {
  collectionName: 'components_certificate_names_certificates';
  info: {
    displayName: 'certificate';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    signature: Attribute.Media;
    designation: Attribute.String;
  };
}

export interface CompletedLessonsLessonComplete extends Schema.Component {
  collectionName: 'components_completed_lessons_lesson_completes';
  info: {
    displayName: 'LessonComplete';
    description: '';
  };
  attributes: {
    LessonTitle: Attribute.String;
    course_id: Attribute.String;
    unitId: Attribute.String;
    entryType: Attribute.Enumeration<['lesson', 'quiz_unit', 'quiz_final']> &
      Attribute.DefaultTo<'lesson'>;
    quizScore: Attribute.Integer;
    totalQuestions: Attribute.Integer;
    percentage: Attribute.Decimal;
    passed: Attribute.Boolean & Attribute.DefaultTo<false>;
    attemptedAt: Attribute.DateTime;
    courseTitle: Attribute.String;
  };
}

export interface CompletedLessonsUser extends Schema.Component {
  collectionName: 'components_completed_lessons_users';
  info: {
    displayName: 'user';
    description: '';
  };
  attributes: {
    username: Attribute.String;
    LessonTitle: Attribute.Component<'completed-lessons.lesson-complete', true>;
  };
}

export interface ContactUsContactUs extends Schema.Component {
  collectionName: 'components_contact_us_contact_uses';
  info: {
    displayName: 'Contact Us';
    description: '';
  };
  attributes: {
    address: Attribute.Text;
    email: Attribute.Email;
    phone: Attribute.BigInteger;
  };
}

export interface CouponsCoupons extends Schema.Component {
  collectionName: 'components_coupons_coupons';
  info: {
    displayName: 'coupons';
  };
  attributes: {
    coupon: Attribute.String;
    percentage: Attribute.String;
    active: Attribute.Boolean;
  };
}

export interface CourseSkillsYouGain extends Schema.Component {
  collectionName: 'components_course_skills_you_gains';
  info: {
    displayName: 'Skills you gain';
  };
  attributes: {
    points: Attribute.String;
  };
}

export interface CourseWhatYouWillLearn extends Schema.Component {
  collectionName: 'components_course_what_you_will_learns';
  info: {
    displayName: 'What you will learn';
  };
  attributes: {
    points: Attribute.String;
  };
}

export interface FaqsFaqs extends Schema.Component {
  collectionName: 'components_faqs_faqs';
  info: {
    displayName: 'faqs';
  };
  attributes: {
    question: Attribute.String;
    answer: Attribute.String;
  };
}

export interface HeroTitleSubtitle extends Schema.Component {
  collectionName: 'components_hero_title_subtitles';
  info: {
    displayName: 'title-subtitle';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    subtitle: Attribute.Text;
    services: Attribute.Component<'services.services', true>;
  };
}

export interface HeroTrainingAbout extends Schema.Component {
  collectionName: 'components_hero_training_abouts';
  info: {
    displayName: 'training-about';
  };
  attributes: {
    title: Attribute.String;
    description_one: Attribute.Text;
    description_two: Attribute.Text;
  };
}

export interface HowItWorksHowItWorks extends Schema.Component {
  collectionName: 'components_how_it_works_how_it_works';
  info: {
    displayName: 'How it works';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    working_steps: Attribute.Component<'services.list-of-services', true>;
  };
}

export interface LearnMoreLearnMore extends Schema.Component {
  collectionName: 'components_learn_more_learn_mores';
  info: {
    displayName: 'Learn More';
    description: '';
  };
  attributes: {
    help: Attribute.Component<'social-media-links.social-media-link', true>;
  };
}

export interface LessonsLessonsdescription extends Schema.Component {
  collectionName: 'components_lessons_lessonsdescriptions';
  info: {
    displayName: 'lessonsdescription';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    subtitle: Attribute.Text;
    time: Attribute.String;
    content: Attribute.RichText;
    lessonContent: Attribute.Blocks;
  };
}

export interface ListGroupOfItems extends Schema.Component {
  collectionName: 'components_list_group_of_items';
  info: {
    displayName: 'group of items';
  };
  attributes: {
    item: Attribute.String;
  };
}

export interface PlannedCustomersBusinessCustomers extends Schema.Component {
  collectionName: 'components_planned_customers_business_customers';
  info: {
    displayName: 'Business Customers';
  };
  attributes: {
    name: Attribute.String;
    plan: Attribute.String;
    email: Attribute.Email;
    message: Attribute.RichText;
  };
}

export interface PricingDetailsPricingDetails extends Schema.Component {
  collectionName: 'components_pricing_details_pricing_details';
  info: {
    displayName: 'Pricing Details';
    description: '';
  };
  attributes: {
    monthly_price: Attribute.Float;
    yearly_price: Attribute.Float;
    plan_name: Attribute.String & Attribute.Required;
    plan_features: Attribute.Component<'list.group-of-items', true>;
    suggested_for: Attribute.String;
    support: Attribute.String;
    custom_pricing: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface PricingPricing extends Schema.Component {
  collectionName: 'components_pricing_pricings';
  info: {
    displayName: 'Pricing';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    plans: Attribute.Component<'pricing-details.pricing-details', true>;
  };
}

export interface QuizQuizOptions extends Schema.Component {
  collectionName: 'components_quiz_quiz_options';
  info: {
    displayName: 'quizOptions';
    description: '';
  };
  attributes: {
    option: Attribute.String;
  };
}

export interface QuizQuiz extends Schema.Component {
  collectionName: 'components_quiz_quizzes';
  info: {
    displayName: 'quiz';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    correctAnswer: Attribute.String;
    description: Attribute.Text;
    options: Attribute.Component<'quiz.quiz-options', true>;
  };
}

export interface ServicesListOfServices extends Schema.Component {
  collectionName: 'components_services_list_of_services';
  info: {
    displayName: 'list of services';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    description: Attribute.Text;
    link: Attribute.String;
  };
}

export interface ServicesServices extends Schema.Component {
  collectionName: 'components_services_services';
  info: {
    displayName: 'services';
    description: '';
  };
  attributes: {
    description: Attribute.Text;
  };
}

export interface SocialMediaLinksSocialMediaLink extends Schema.Component {
  collectionName: 'components_social_media_links_social_media_links';
  info: {
    displayName: 'Social Media Link';
  };
  attributes: {
    name: Attribute.String;
    link: Attribute.String;
  };
}

export interface StepsStrategySteps extends Schema.Component {
  collectionName: 'components_steps_strategy_steps';
  info: {
    displayName: 'strategy steps';
  };
  attributes: {
    title: Attribute.String;
    strategy_step_list: Attribute.Component<'list.group-of-items', true>;
    strategy_step_image: Attribute.Media;
  };
}

export interface StrategyStrategy extends Schema.Component {
  collectionName: 'components_strategy_strategies';
  info: {
    displayName: 'Strategy';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    steps: Attribute.Component<'steps.strategy-steps', true>;
  };
}

export interface TestimonialSectionTestimonialSection extends Schema.Component {
  collectionName: 'components_testimonial_section_testimonial_sections';
  info: {
    displayName: 'Testimonial-Section';
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.String;
    testimonialListing: Attribute.Component<'testimonials.testimonials', true>;
  };
}

export interface TestimonialsTestimonials extends Schema.Component {
  collectionName: 'components_testimonials_testimonials';
  info: {
    displayName: 'Testimonials';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    review: Attribute.Text & Attribute.Required;
    designation: Attribute.String;
    company_name: Attribute.String & Attribute.Required;
    rating: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'about.about': AboutAbout;
      'array.standardarray': ArrayStandardarray;
      'card.our-solutions': CardOurSolutions;
      'certificate-names.certificate': CertificateNamesCertificate;
      'completed-lessons.lesson-complete': CompletedLessonsLessonComplete;
      'completed-lessons.user': CompletedLessonsUser;
      'contact-us.contact-us': ContactUsContactUs;
      'coupons.coupons': CouponsCoupons;
      'course.skills-you-gain': CourseSkillsYouGain;
      'course.what-you-will-learn': CourseWhatYouWillLearn;
      'faqs.faqs': FaqsFaqs;
      'hero.title-subtitle': HeroTitleSubtitle;
      'hero.training-about': HeroTrainingAbout;
      'how-it-works.how-it-works': HowItWorksHowItWorks;
      'learn-more.learn-more': LearnMoreLearnMore;
      'lessons.lessonsdescription': LessonsLessonsdescription;
      'list.group-of-items': ListGroupOfItems;
      'planned-customers.business-customers': PlannedCustomersBusinessCustomers;
      'pricing-details.pricing-details': PricingDetailsPricingDetails;
      'pricing.pricing': PricingPricing;
      'quiz.quiz-options': QuizQuizOptions;
      'quiz.quiz': QuizQuiz;
      'services.list-of-services': ServicesListOfServices;
      'services.services': ServicesServices;
      'social-media-links.social-media-link': SocialMediaLinksSocialMediaLink;
      'steps.strategy-steps': StepsStrategySteps;
      'strategy.strategy': StrategyStrategy;
      'testimonial-section.testimonial-section': TestimonialSectionTestimonialSection;
      'testimonials.testimonials': TestimonialsTestimonials;
    }
  }
}
