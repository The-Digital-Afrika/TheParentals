import React, { useEffect, useRef, useId } from 'react';

import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Tab' && isOpen) {
        const fields = [...(modalRef.current?.querySelectorAll('button:not(:disabled), textarea:not(:disabled), input:not(:disabled), a[href], select:not(:disabled)') || [])];
        const first = fields[0], last = fields[fields.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
      if (e.key === 'Escape' && isOpen) {
        closeRef.current();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && isOpen) {
        closeRef.current();
      }
    };

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      (modalRef.current?.querySelector('textarea, input, [autofocus]') || modalRef.current?.querySelector('button'))?.focus();
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = previousOverflow;
      if (isOpen) previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal" style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={titleId} style={{position:"relative",background:"white",color:"#243746",padding:28,borderRadius:12,width:"100%",maxWidth:620,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <button type="button" style={{position:"absolute",right:12,top:8,fontSize:26,background:"transparent",border:0,cursor:"pointer"}} className="close-modal" onClick={onClose} aria-label="Close modal">&times;</button>
        <h2 id={titleId}>{title}</h2>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>, document.body
  );
};

export default Modal;
