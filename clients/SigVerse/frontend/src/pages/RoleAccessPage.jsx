import Icon from '../components/Icon';

const ROLE_CARDS = [
  {
    key: 'learner',
    title: 'Learner',
    icon: 'enrollments',
    points: [
      'Enroll in catalog courses',
      'Track progress and performance',
      'Unlock certificates after completion'
    ]
  },
  {
    key: 'instructor',
    title: 'Instructor',
    icon: 'instructor',
    points: [
      'Submit course, module, and lesson changes',
      'Wait for admin approval before publishing',
      'Manage approved teaching content'
    ]
  },
  {
    key: 'admin',
    title: 'Admin',
    icon: 'admin',
    points: [
      'Review users, courses, and approvals',
      'Approve instructor registrations and content',
      'Oversee platform-wide operations'
    ]
  }
];

export default function RoleAccessPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Role <span className="text-gradient">Access</span></h1>
        <p className="page-subtitle">How Sigverse access is separated across learner, instructor, and admin workflows.</p>
      </div>
      <div className="role-access-grid">
        {ROLE_CARDS.map((card) => (
          <article key={card.key} className="role-access-card">
            <div className="role-access-icon">
              <Icon name={card.icon} size={22} />
            </div>
            <h2 className="role-access-title">{card.title}</h2>
            <div className="role-access-points">
              {card.points.map((point) => (
                <div key={point} className="role-access-point">
                  <Icon name="check" size={14} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
