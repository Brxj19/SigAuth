import { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import ConfirmModal from '../components/ConfirmModal';
import useToast from '../hooks/useToast';
import { usePageTitle } from '../hooks/usePageTitle';
import { approveRequest, getApprovals, rejectRequest } from '../services/approvalService';

const PAGE_SIZE = 8;

function PayloadRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="payload-row">
      <span className="payload-label">{label}</span>
      <span className="payload-value">{String(value)}</span>
    </div>
  );
}

function ApprovalPayload({ request }) {
  const p = request.payload || {};
  const type = request.request_type;

  if (type === 'instructor_signup') {
    return (
      <div className="approval-payload-pretty">
        <p className="payload-section-title">Instructor Details</p>
        <PayloadRow label="Full name"     value={p.name} />
        <PayloadRow label="Email"         value={p.email} />
        <PayloadRow label="Role"          value={p.role} />
        <PayloadRow label="Account ID"    value={p.user_id} />
        <PayloadRow label="Signup method" value={p.provider || 'email'} />
      </div>
    );
  }

  if (type === 'course') {
    return (
      <div className="approval-payload-pretty">
        <p className="payload-section-title">Course Details</p>
        <PayloadRow label="Title"         value={p.title} />
        <PayloadRow label="Description"   value={p.description} />
        <PayloadRow label="Instructor ID" value={p.instructor_id} />
        <PayloadRow label="Video URL"     value={p.youtube_video_url} />
      </div>
    );
  }

  if (type === 'module') {
    return (
      <div className="approval-payload-pretty">
        <p className="payload-section-title">Module Details</p>
        <PayloadRow label="Module name"    value={p.module_name} />
        <PayloadRow label="Course ID"      value={p.course_id} />
        <PayloadRow label="Sequence order" value={p.sequence_order} />
      </div>
    );
  }

  if (type === 'lesson') {
    return (
      <div className="approval-payload-pretty">
        <p className="payload-section-title">Lesson Details</p>
        <PayloadRow label="Lesson name" value={p.lesson_name} />
        <PayloadRow label="Module ID"   value={p.module_id} />
        <PayloadRow label="Video URL"   value={p.youtube_video_url} />
        <PayloadRow label="Content"     value={p.content ? p.content.slice(0, 120) + (p.content.length > 120 ? '…' : '') : null} />
      </div>
    );
  }

  const entries = Object.entries(p).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return null;
  return (
    <div className="approval-payload-pretty">
      <p className="payload-section-title">Request Details</p>
      {entries.map(([k, v]) => (
        <PayloadRow key={k} label={k.replace(/_/g, ' ')} value={typeof v === 'object' ? JSON.stringify(v) : v} />
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [approvalActionId, setApprovalActionId] = useState(null);

  usePageTitle('Admin Panel');

  // Tab configuration for admin panel sections
  const tabs = [
    { key: 'users', label: 'Users', icon: 'user' },
    { key: 'courses', label: 'Courses', icon: 'courses' },
    { key: 'enrollments', label: 'Enrollments', icon: 'enrollments' },
    { key: 'approvals', label: 'Approvals', icon: 'shield' }
  ];

  // Fetches data based on active tab, handles approvals filtering
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = tab === 'approvals' ? await getApprovals() : await api.get(`/${tab}`);
      const payload = res.data.data || [];
      if (tab === 'approvals') {
        setData(payload.filter((request) => ['course', 'instructor_signup'].includes(request.request_type)));
      } else {
        setData(payload);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to load admin data', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab]);
  useEffect(() => { setCurrentPage(1); }, [tab, searchValue]);

  // Filters data based on search input across all fields
  const filteredData = data.filter((item) => {
    const haystack = Object.values(item || {}).join(' ').toLowerCase();
    return haystack.includes(searchValue.trim().toLowerCase());
  });

  // Calculates pagination data for current page display
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Deletes selected item and refreshes data
  const handleDelete = async () => {
    if (confirmTarget === null) return;
    try {
      await api.delete(`/${tab}/${confirmTarget}`);
      showToast('Deleted successfully', 'success');
      setConfirmTarget(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
      setConfirmTarget(null);
    }
  };

  // Saves or updates item with form submission handling
  const handleSaveEdit = async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.target));
    if (formData.instructor_id) formData.instructor_id = parseInt(formData.instructor_id, 10);
    if (formData.user_id) formData.user_id = parseInt(formData.user_id, 10);
    if (formData.course_id) formData.course_id = parseInt(formData.course_id, 10);

    try {
      if (editModal?.id) {
        await api.patch(`/${tab}/${editModal.id}`, formData);
        showToast('Updated successfully', 'success');
      } else {
        await api.post(`/${tab}`, formData);
        showToast('Created successfully', 'success');
      }
      setEditModal(null);
      fetchData();
    } catch (err) { showToast(err.response?.data?.message || 'Save failed', 'error'); }
  };

  // Approves or rejects request with status update
  const handleApproval = async (requestId, action) => {
    if (approvalActionId === requestId) return;

    setApprovalActionId(requestId);
    try {
      if (action === 'approve') {
        await approveRequest(requestId);
        showToast('Request approved', 'success');
      } else {
        await rejectRequest(requestId);
        showToast('Request rejected', 'success');
      }
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval action failed', 'error');
    } finally {
      setApprovalActionId(null);
    }
  };

  // Formats approval request title from action and type
  const getApprovalTitle = (request) => {
    const actionLabel = {
      create: 'Create',
      update: 'Update',
      delete: 'Delete'
    }[request.action] || 'Review';

    const typeLabel = {
      instructor_signup: 'Instructor Signup',
      course: 'Course',
      module: 'Module',
      lesson: 'Lesson'
    }[request.request_type] || 'Request';

    return `${actionLabel} ${typeLabel}`;
  };

  // Generates approval request summary based on type
  const getApprovalSummary = (request) => {
    if (request.request_type === 'instructor_signup') {
      const name = request.payload?.name || 'New instructor';
      const email = request.payload?.email ? ` (${request.payload.email})` : '';
      return `${name}${email}`;
    }

    if (request.request_type === 'course') {
      return request.payload?.title || 'Course request pending review';
    }

    if (request.request_type === 'module') {
      return request.payload?.module_name || 'Module request pending review';
    }

    if (request.request_type === 'lesson') {
      return request.payload?.lesson_name || 'Lesson request pending review';
    }

    return 'Approval request pending review';
  };

  // Formats approval metadata including requester and timestamp
  const getApprovalMeta = (request) => {
    const createdAt = request.created_at ? new Date(request.created_at).toLocaleString() : '';
    const requester = request.requester_id ? `Requester #${request.requester_id}` : 'Pending local signup';
    const entity = request.entity_id ? `Entity ${String(request.entity_id)}` : 'New';
    return `${requester} • ${entity}${createdAt ? ` • ${createdAt}` : ''}`;
  };

  // Returns table columns based on active tab
  const getColumns = () => {
    switch (tab) {
      case 'users': return ['id', 'name', 'email', 'role'];
      case 'courses': return ['id', 'title', 'description', 'instructor_id'];
      case 'enrollments': return ['id', 'user_id', 'course_id', 'status'];
      default: return [];
    }
  };

  // Returns form fields configuration based on tab
  const getFormFields = () => {
    switch (tab) {
      case 'users': return [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'role', label: 'Role', type: 'select', options: ['learner', 'instructor', 'admin'] }
      ];
      case 'courses': return [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'instructor_id', label: 'Instructor ID', type: 'number' }
      ];
      case 'enrollments': return [
        { name: 'user_id', label: 'User ID', type: 'number' },
        { name: 'course_id', label: 'Course ID', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'completed'] }
      ];
      default: return [];
    }
  };

  // Renders the admin panel with tabs, data table, and modals for editing and confirming actions
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin <span className="text-gradient">Panel</span></h1>
        <p className="page-subtitle">Manage users, courses, enrollments, and approval workflows.</p>
      </div>
      <div className="admin-tabs">
        {tabs.map((tabItem) => (
          <button key={tabItem.key} className={`tab-btn ${tab === tabItem.key ? 'active' : ''}`} onClick={() => setTab(tabItem.key)}>
            <Icon name={tabItem.icon} size={15} />
            <span>{tabItem.label}</span>
          </button>
        ))}
      </div>
      <div className="admin-toolbar">
        <label className="admin-search">
          <Icon name="search" size={14} />
          <input
            type="search"
            className="form-input"
            placeholder={`Search ${tab}`}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </label>
        {tab !== 'approvals' && (
          <button className="btn btn-primary btn-sm" onClick={() => setEditModal({})}>Create New</button>
        )}
      </div>
      {loading ? <LoadingSpinner /> : (
        <>
          {tab === 'approvals' ? (
            <div className="approval-list">
              {paginatedData.length === 0 && <p className="empty-state">No approval requests found.</p>}
              {paginatedData.map((request) => (
                <article key={request._id} className="approval-card">
                  <div className="approval-card-head">
                    <div>
                      <span className="approval-request-type">{getApprovalTitle(request)}</span>
                      <h3>{getApprovalSummary(request)}</h3>
                    </div>
                    <span className={`status-badge status-${request.status}`}>{request.status}</span>
                  </div>
                  <p className="course-desc-sm">{getApprovalMeta(request)}</p>
                  {request.note && request.status === 'rejected' && (
                    <p className="approval-note">Admin note: {request.note}</p>
                  )}
                  {/* <pre className="approval-payload">{JSON.stringify(request.payload || {}, null, 2)}</pre> */}
                  <ApprovalPayload request={request} />
                  {request.status === 'pending' && (
                    <div className="approval-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApproval(request._id, 'approve')}
                        disabled={approvalActionId === request._id}
                      >
                        {approvalActionId === request._id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleApproval(request._id, 'reject')}
                        disabled={approvalActionId === request._id}
                      >
                        {approvalActionId === request._id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    {getColumns().map((col) => <th key={col}>{col}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      {getColumns().map((col) => <td key={col}>{String(item[col] ?? '')}</td>)}
                      <td className="actions-cell">
                        <button className="btn btn-ghost btn-xs" onClick={() => setEditModal(item)}>Edit</button>
                        <button className="btn btn-danger btn-xs" onClick={() => setConfirmTarget(item.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredData.length}
            itemLabel={tab}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      {editModal !== null && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{editModal?.id ? 'Edit' : 'Create'} {tab.slice(0, -1)}</h3>
            <form onSubmit={handleSaveEdit}>
              {getFormFields().map((field) => (
                <div key={field.name} className="form-group">
                  <label className="form-label">{field.label}</label>
                  {field.type === 'select' ? (
                    <select name={field.name} className="form-input" defaultValue={editModal?.[field.name] || field.options[0]}>
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input name={field.name} type={field.type} className="form-input" defaultValue={editModal?.[field.name] || ''} required />
                  )}
                </div>
              ))}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmTarget !== null && (
        <ConfirmModal
          title="Delete this item?"
          message="This action cannot be undone."
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleDelete}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
