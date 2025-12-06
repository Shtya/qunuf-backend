import { CompanyInfo, CompanySection } from "src/common/entities/companyInfo.entity";
import { Department } from "src/common/entities/department.entity";
import { TeamMember } from "src/common/entities/team.entity";

export const SAUDI_STATES = [
    'Riyadh',
    'Makkah',
    'Madinah',
    'Qassim',
    'Eastern Province',
    'Asir',
    'Tabuk',
    'Hail',
    'Northern Borders',
    'Jazan',
    'Najran',
    'Bahah',
    'Jawf',
];

export const PROPERTY_TYPES = [
    {
        name: 'Residential',
        subtypes: [
            'Apartment',
            'Villa',
            'Condo',
            'Duplex',
            'Townhomes',
            'Townhouse',
            'Multi-family',
            'Single-Family',
        ],
    },
    {
        name: 'Commercial',
        subtypes: [
            'Office',
            'Retail',
            'Warehouse',
            'Industrial',
            'Hotel',
        ],
    },
];



export const COMPANY_SECTIONS: Partial<CompanyInfo>[] = [
    {
        section: CompanySection.MISSION,
        title_en: 'Our Mission',
        title_ar: 'مهمتنا',
        content_en: `At the core of our mission is the optimization of your time, physical vitality, and mental energy, enabling you to concentrate more effectively on your objectives and excel in your professional endeavors.`,
        content_ar: `في صميم مهمتنا هو تحسين وقتك، صحتك البدنية والعقلية، مما يمكنك من التركيز على أهدافك وتحقيق التفوق في مهامك المهنية.`,
        imagePath: "/uploads/images/company-info/mission.jpg",
    },
    {
        section: CompanySection.VISION,
        title_en: 'Our Vision',
        title_ar: 'رؤيتنا',
        content_en: `At the core of our vision is the optimization of your time, physical vitality, and mental energy, enabling you to concentrate more effectively on your objectives and excel in your professional endeavors.`,
        content_ar: `في صميم رؤيتنا هو تحسين وقتك، صحتك البدنية والعقلية، مما يمكنك من التركيز على أهدافك وتحقيق التفوق في مهامك المهنية.`,
        imagePath: "/uploads/images/company-info/vision.jpg",
    },
    {
        section: CompanySection.GOALS,
        title_en: 'Our Goals',
        title_ar: 'أهدافنا',
        content_en: `At the core of our goals is the optimization of your time, physical vitality, and mental energy, enabling you to concentrate more effectively on your objectives and excel in your professional endeavors.`,
        content_ar: `في صميم أهدافنا هو تحسين وقتك، صحتك البدنية والعقلية، مما يمكنك من التركيز على أهدافك وتحقيق التفوق في مهامك المهنية.`,
        imagePath: "/uploads/images/company-info/goals.jpg",
    },
    {
        section: CompanySection.HISTORY,
        title_en: 'History of Qunuf',
        title_ar: 'تاريخ قنف',
        content_en: `Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque assumenda incidunt id cum. Fugiat repellat cumque delectus, at ipsum ad iure explicabo perferendis. If you're still reading this, congrats, you're officially a masochist.`,
        content_ar: `لوريم ايبسوم دولار سيت أميت، كونسيكتيتور أديبيسيسينغ إليت. دولوريمك أسسومندا إينسيدونت إد كوم. فوجيات ريبيلات كومكي ديليكتوس، في إيبسوم آد يور إكسبليكاتيو بيرفيرينديس. إذا كنت لا تزال تقرأ هذا، تهانينا، أنت رسميًا متحمس للتحدي.`,
        imagePath: "/uploads/images/company-info/History.jpg",
    },
    {
        section: CompanySection.WHY_US,
        title_en: 'Why Qunuf',
        title_ar: 'لماذا قنف',
        content_en: `Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque assumenda incidunt id cum. Fugiat repellat cumque delectus, at ipsum ad iure explicabo perferendis.`,
        content_ar: `لوريم ايبسوم دولار سيت أميت، كونسيكتيتور أديبيسيسينغ إليت. دولوريمك أسسومندا إينسيدونت إد كوم. فوجيات ريبيلات كومكي ديليكتوس، في إيبسوم آد يور إكسبليكاتيو بيرفيرينديس.`,
        imagePath: "/uploads/images/company-info/Why.jpg",
    }
];

export const DEPARTMENTS: Partial<Department>[] = [
    {
        title_ar: 'خدمة العملاء',
        title_en: 'Customer Service Department',
        description_ar: 'قسم خدمة العملاء لدينا مكرس بالكامل لتقديم خدمة لا تضاهى لعملائنا الموقرين. من أول نقطة تلامس، يتم استقبال العملاء بابتسامة ودية وسلوك داعم. يخضع فريقنا لتدريب صارم للتعامل بكفاءة وفعالية مع طلبات واستفسارات العملاء، مما يضمن تجربة رائعة تحافظ على المعايير العليا التي نعتز بها.',
        description_en: 'Our Customer Service Department is wholly committed to delivering unparalleled service to our valued customers. From the very first point of contact, customers are warmly welcomed with a friendly smile and a supportive demeanor. Our team undergoes rigorous training to adeptly handle customer requests and inquiries with efficiency and efficacy, ensuring a remarkable experience that upholds the elevated standards we hold dear.',
        imagePath: 'uploads/images/departments/team-1.png',
    },
];

export const TEAM_MEMBERS: Partial<TeamMember>[] = [
    {
        name: 'John Carvan',
        job: 'Senior Developer',
        description_ar: 'يتخصص جون في بناء تطبيقات قابلة للتوسع وتدريب المطورين الصغار. نهجه المنظم يضمن تسليم المشاريع بوضوح ودقة.',
        description_en: 'John specializes in building scalable applications and mentoring junior developers. His structured approach ensures projects are delivered with clarity and precision.',
        imagePath: 'uploads/images/teams/team-1.png',
    },
    {
        name: 'Miss Smith Ellen',
        job: 'Project Manager',
        description_ar: 'تنسق إيلين الفريق متعدد الوظائف وتحافظ على سير المشاريع. تضمن مهاراتها التنظيمية والتواصل الواضح تعاونًا سلسًا.',
        description_en: 'Ellen coordinates cross-functional teams and keeps projects on track. Her organizational skills and clear communication make collaboration seamless.',
        imagePath: 'uploads/images/teams/team-2.png',
    },
    {
        name: 'John Carvan',
        job: 'UI/UX Designer',
        description_ar: 'يصمم جون تجارب مستخدم بديهية وواجهات مصقولة. يربط تفكيره التصميمي بين الإبداع والقابلية للاستخدام، مما يجعل المنتجات يسهل الوصول إليها وجذابة.',
        description_en: 'John crafts intuitive user experiences and polished interfaces. His design thinking bridges creativity with usability, making products accessible and engaging.',
        imagePath: 'uploads/images/teams/team-3.png',
    },
];