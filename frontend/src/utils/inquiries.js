const INQUIRIES_KEY = 'sah_inquiries';

const readList = () => {
  try {
    const value = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeList = (items) => {
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(items));
};

export const getInquiries = () => readList();

export const createInquiry = (payload) => {
  const now = new Date().toISOString();
  const inquiry = {
    id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    status: 'new',
    providerRead: false,
    clientRead: false,
    ...payload,
  };

  writeList([inquiry, ...readList()]);
  return inquiry;
};

export const markInquiryRead = (id, audience) => {
  const key = audience === 'provider' ? 'providerRead' : 'clientRead';
  const updated = readList().map((item) => (
    item.id === id ? { ...item, [key]: true } : item
  ));
  writeList(updated);
  return updated;
};

export const respondToInquiry = (id, response) => {
  const cleanResponse = String(response || '').trim();
  if (!cleanResponse) return readList();

  const updated = readList().map((item) => (
    item.id === id
      ? {
          ...item,
          status: 'responded',
          providerResponse: cleanResponse,
          respondedAt: new Date().toISOString(),
          clientRead: false,
        }
      : item
  ));
  writeList(updated);
  return updated;
};

export const formatInquiryDate = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};
