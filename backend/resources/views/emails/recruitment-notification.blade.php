<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $subjectLine }}</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f1fa;
    font-family:Arial, Helvetica, sans-serif;
    color:#222;
">

<div style="
    max-width:640px;
    margin:40px auto;
    background:#ffffff;
    border-radius:18px;
    overflow:hidden;
    box-shadow:0 12px 35px rgba(0,0,0,0.08);
">

    <div style="
        padding:28px;
        background:#6834d9;
        color:#ffffff;
    ">

        <div style="
            font-size:12px;
            font-weight:bold;
            letter-spacing:2px;
            text-transform:uppercase;
            opacity:.8;
        ">
            ALTRIUM RECRUITMENT
        </div>

        <h1 style="
            margin:10px 0 0;
            font-size:26px;
        ">
            {{ $heading }}
        </h1>

    </div>

    <div style="padding:30px;">

        <p style="
            font-size:15px;
            line-height:1.7;
            margin-top:0;
        ">
            {{ $messageText }}
        </p>

        @if(count($details) > 0)

            <div style="margin-top:24px;">

                @foreach($details as $label => $value)

                    <div style="
                        padding:13px 0;
                        border-bottom:1px solid #eeeeee;
                    ">

                        <div style="
                            font-size:11px;
                            font-weight:bold;
                            text-transform:uppercase;
                            letter-spacing:1px;
                            color:#888;
                        ">
                            {{ $label }}
                        </div>

                        <div style="
                            margin-top:4px;
                            font-size:15px;
                            color:#222;
                        ">
                            {{ $value }}
                        </div>

                    </div>

                @endforeach

            </div>

        @endif

        <p style="
            margin-top:30px;
            font-size:14px;
            line-height:1.6;
            color:#666;
        ">
            Regards,<br>
            <strong>Altrium Recruitment Team</strong>
        </p>

    </div>

</div>

</body>
</html>