-- Allow admins to view all mentor applications
CREATE POLICY "Admins can view all applications"
ON public.mentor_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update mentor applications (approve/reject)
CREATE POLICY "Admins can update applications"
ON public.mentor_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all user roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to insert user roles (for approving mentors)
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow admins to view all courses
CREATE POLICY "Admins can view all courses"
ON public.courses
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.enrollments
FOR SELECT
USING (has_role(auth.uid(), 'admin'));