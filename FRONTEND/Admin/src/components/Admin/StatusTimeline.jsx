import React from 'react';

const StatusTimeline = ({ timeline = [] }) => {
    const statusColors = {
        created: '#6c757d',
        confirmed: '#0dcaf0',
        processing: '#ffc107',
        shipped: '#0d6efd',
        out_for_delivery: '#fd7e14',
        delivered: '#198754',
        cancelled: '#dc3545'
    };

    const statusLabels = {
        created: 'Order Created',
        confirmed: 'Order Confirmed',
        processing: 'Processing',
        shipped: 'Shipped',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
    };

    const getIconClass = (status) => {
        const iconMap = {
            created: 'fas fa-receipt',
            confirmed: 'fas fa-check-circle',
            processing: 'fas fa-cogs',
            shipped: 'fas fa-box',
            out_for_delivery: 'fas fa-truck',
            delivered: 'fas fa-check-double',
            cancelled: 'fas fa-times-circle'
        };
        return iconMap[status] || 'fas fa-circle';
    };

    if (!timeline || timeline.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <p>No status updates yet</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <i className="fas fa-history" style={{ marginRight: '8px', color: '#0d6efd', fontSize: '16px' }}></i>
                <h6 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#333' }}>Order Timeline</h6>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {timeline.map((event, index) => (
                    <div key={index} style={{
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: `2px solid ${statusColors[event.status] || '#e9ecef'}`,
                        borderLeft: `4px solid ${statusColors[event.status] || '#999'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <i style={{
                                color: '#fff',
                                fontSize: '14px',
                                backgroundColor: statusColors[event.status] || '#999',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px'
                            }} className={getIconClass(event.status)}></i>
                            <span style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: statusColors[event.status] || '#333',
                                flex: 1
                            }}>
                                {statusLabels[event.status] || event.status}
                            </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#999', margin: '6px 0' }}>
                            {event.timestamp ? new Date(event.timestamp).toLocaleDateString() + ' ' + new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                        {event.message && (
                            <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
                                {event.message}
                            </p>
                        )}
                        {event.updated_by && (
                            <p style={{ fontSize: '11px', color: '#999', margin: '4px 0', fontStyle: 'italic' }}>
                                Updated by: <strong>{event.updated_by}</strong>
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusTimeline;
