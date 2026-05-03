CREATE POLICY "Staff can update any build"
ON public.builds
FOR UPDATE
USING (has_app_role(auth.uid(), 'admin') OR has_app_role(auth.uid(), 'mod'))
WITH CHECK (has_app_role(auth.uid(), 'admin') OR has_app_role(auth.uid(), 'mod'));

CREATE POLICY "Staff can update any tournament"
ON public.tournaments
FOR UPDATE
USING (has_app_role(auth.uid(), 'admin') OR has_app_role(auth.uid(), 'mod'))
WITH CHECK (has_app_role(auth.uid(), 'admin') OR has_app_role(auth.uid(), 'mod'));